import { randomBytes, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { isRedisConfigured, pipeline, redisEval } from '@/lib/redis'
import { sanitizeContent, seededContent } from './content'
import { canPublishFor, draftLimit, isArchived } from './commerce'
import { PlatformError } from './errors'
import { createFileDb, type WriteCode } from './file-db'
import { listOrders } from './ledger'
import { assertMediaOwned, deleteMediaForOwner, markMediaPublic } from './media'
import { collectMediaIds } from './media-ids'
import { normalizeEmail, usernameSeed } from './identity'
import { hashPassword } from './password'
import { planCopy, planInvitationWrite, publicContent, publicTemplate, type SaveMode } from './save-plan'
import { parseInvite } from './records'
import { normalizeSlug, normalizeUsername, slugError } from './slug'
import { storageKind } from './storage-mode'
import { isTemplateId, type TemplateId } from './templates'
import type { AdminUserRow, InvitationRecord, InvitationSummary, PlatformUser, PublicUser, Role } from './types'
import type { WeddingContent } from '@/lib/content'

const files = createFileDb(join(process.cwd(), 'data', 'platform.json'))

const USERS_INDEX = 'platform:user-ids'
const userKey = (id: string) => `platform:user:${id}`
const usernameKey = (username: string) => `platform:uname:${username}`
const emailKey = (email: string) => `platform:email:${email}`
const facebookKey = (facebookId: string) => `platform:fb:${facebookId}`
const inviteKey = (slug: string) => `platform:invite:${slug}`
const idKey = (id: string) => `platform:invite-id:${id}`
const ownedKey = (ownerId: string) => `platform:owned:${ownerId}`
const legacyOwnerKey = (ownerId: string) => `platform:owner:${ownerId}`

const INSERT_USER = `
if redis.call('EXISTS', KEYS[1]) == 1 then return 'taken' end
if ARGV[3] == '1' and redis.call('EXISTS', KEYS[4]) == 1 then return 'email' end
if ARGV[4] == '1' and redis.call('EXISTS', KEYS[5]) == 1 then return 'facebook' end
redis.call('SET', KEYS[2], ARGV[1])
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SADD', KEYS[3], ARGV[2])
if ARGV[3] == '1' then redis.call('SET', KEYS[4], ARGV[2]) end
if ARGV[4] == '1' then redis.call('SET', KEYS[5], ARGV[2]) end
return 'ok'
`

const INSERT_INVITE = `
if redis.call('EXISTS', KEYS[1]) == 1 then return 'slug' end
if redis.call('EXISTS', KEYS[2]) == 1 then return 'slug' end
redis.call('SET', KEYS[1], ARGV[1])
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SADD', KEYS[3], ARGV[3])
return 'ok'
`

const REPLACE_INVITE = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 'missing' end
local ok, data = pcall(cjson.decode, raw)
if not ok or type(data) ~= 'table' then return 'missing' end
if data.ownerId ~= ARGV[3] or data.id ~= ARGV[4] then return 'forbidden' end
local rev = tonumber(data.revision) or 0
if rev ~= tonumber(ARGV[1]) then return 'conflict' end
if KEYS[1] ~= KEYS[2] and redis.call('EXISTS', KEYS[2]) == 1 then return 'slug' end
redis.call('SET', KEYS[2], ARGV[2])
if KEYS[1] ~= KEYS[2] then redis.call('DEL', KEYS[1]) end
redis.call('SET', KEYS[3], ARGV[5])
redis.call('SADD', KEYS[4], ARGV[4])
local legacy = redis.call('GET', KEYS[5])
if legacy == ARGV[6] then redis.call('SET', KEYS[5], ARGV[5]) end
return 'ok'
`

const DELETE_INVITE = `
local raw = redis.call('GET', KEYS[1])
if not raw then
  local pointer = redis.call('GET', KEYS[2])
  if pointer == ARGV[3] then
    redis.call('DEL', KEYS[2])
    redis.call('SREM', KEYS[3], ARGV[2])
  end
  return 'missing'
end
local ok, data = pcall(cjson.decode, raw)
if not ok or type(data) ~= 'table' then return 'missing' end
if data.ownerId ~= ARGV[1] or data.id ~= ARGV[2] then return 'forbidden' end
redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[2])
redis.call('SREM', KEYS[3], ARGV[2])
local legacy = redis.call('GET', KEYS[4])
if legacy == ARGV[3] then redis.call('DEL', KEYS[4]) end
return 'ok'
`

let queue: Promise<void> = Promise.resolve()

function locked<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export function storageMode(): 'redis' | 'file' {
  return isRedisConfigured ? 'redis' : 'file'
}

function kind() {
  return storageKind({
    redis: isRedisConfigured,
    production: process.env.NODE_ENV === 'production',
    vercel: process.env.VERCEL === '1',
  })
}

export function isInvitationId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function toPublicUser(user: PlatformUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    email: user.email,
  }
}

export function summarizeInvite(invite: InvitationRecord): InvitationSummary {
  const groom = invite.content.couple?.groomShort || invite.content.couple?.groom || ''
  const bride = invite.content.couple?.brideShort || invite.content.couple?.bride || ''
  return {
    id: invite.id,
    slug: invite.slug,
    pendingSlug: invite.pendingSlug,
    templateId: invite.templateId,
    publishedTemplateId: invite.published ? publicTemplate(invite) : undefined,
    published: invite.published,
    updatedAt: invite.updatedAt,
    groom,
    bride,
    revision: invite.revision,
  }
}

async function assertRoom(ownerId: string) {
  const existing = await listByOwner(ownerId)
  const owner = kind() === 'file' ? await files.getUser(ownerId) : inviteUser(await redisGet(userKey(ownerId)))
  const cap = draftLimit(await listOrders(ownerId), ownerId, owner?.role ?? 'member')
  if (existing.length >= cap) {
    throw new PlatformError(
      cap <= 3
        ? 'Tài khoản miễn phí tạo tối đa 3 thiệp nháp. Muốn xuất bản, hãy mua gói Một thiệp hoặc Studio.'
        : `Mỗi tài khoản tối đa ${cap} thiệp`,
    )
  }
}

function assertWrite(code: string): asserts code is 'ok' {
  if (code === 'ok') return
  if (code === 'slug') throw new PlatformError('Đường dẫn này đã có người dùng')
  if (code === 'conflict') {
    throw new PlatformError('Thiệp vừa được lưu ở một phiên khác. Hãy tải lại trang trước khi sửa tiếp.', 409)
  }
  if (code === 'missing' || code === 'forbidden') throw new PlatformError('Không thấy thiệp', 404)
  if (code === 'taken') throw new PlatformError('Tên đăng nhập đã có người dùng')
  if (code === 'email') throw new PlatformError('Email này đã có tài khoản. Hãy đăng nhập.')
  if (code === 'facebook') throw new PlatformError('Tài khoản Facebook này đã được nối')
  throw new PlatformError('Không lưu được dữ liệu', 502)
}

async function evalCode(script: string, keys: string[], args: (string | number)[]) {
  const result = await redisEval(script, keys, args)
  if (typeof result !== 'string') throw new PlatformError('Không lưu được dữ liệu', 502)
  return result
}

async function redisGet(key: string) {
  const [value] = await pipeline([['GET', key]])
  return typeof value === 'string' ? value : null
}

async function inviteFromRaw(raw: string | null) {
  if (!raw) return null
  try {
    return parseInvite(JSON.parse(raw))
  } catch {
    return null
  }
}

async function redisInviteBySlug(slug: string) {
  return inviteFromRaw(await redisGet(inviteKey(slug)))
}

async function absorbLegacy(ownerId: string) {
  if (kind() !== 'redis') return
  const slug = await redisGet(legacyOwnerKey(ownerId))
  if (!slug) return
  const invite = await redisInviteBySlug(slug)
  if (!invite || invite.ownerId !== ownerId) return
  await pipeline([
    ['SET', idKey(invite.id), invite.slug, 'NX'],
    ['SADD', ownedKey(ownerId), invite.id],
  ])
}

async function getById(id: string): Promise<InvitationRecord | null> {
  if (kind() === 'file') return files.getInviteById(id)
  const slug = await redisGet(idKey(id))
  if (!slug) return null
  const invite = await redisInviteBySlug(slug)
  if (!invite || invite.id !== id) return null
  return invite
}

async function getBySlug(slug: string) {
  if (kind() === 'file') return files.getInviteBySlug(slug)
  return redisInviteBySlug(slug)
}

async function listByOwner(ownerId: string) {
  if (kind() === 'file') {
    const invites = await files.listInvitesByOwner(ownerId)
    return invites.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  await absorbLegacy(ownerId)
  const [ids] = await pipeline([['SMEMBERS', ownedKey(ownerId)]])
  const list = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
  if (!list.length) return []
  const pointers = await pipeline(list.map((id) => ['GET', idKey(id)]))
  const commands: (string | number)[][] = []
  for (const pointer of pointers) {
    if (typeof pointer === 'string') commands.push(['GET', inviteKey(pointer)])
  }
  if (!commands.length) return []
  const raws = await pipeline(commands)
  const invites: InvitationRecord[] = []
  const seen = new Set<string>()
  for (const raw of raws) {
    const invite = await inviteFromRaw(typeof raw === 'string' ? raw : null)
    if (!invite || invite.ownerId !== ownerId || seen.has(invite.id)) continue
    seen.add(invite.id)
    invites.push(invite)
  }
  invites.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return invites
}

async function insertInvite(invite: InvitationRecord): Promise<WriteCode> {
  if (kind() === 'file') return files.insertInvite(invite)
  const code = await evalCode(INSERT_INVITE, [inviteKey(invite.slug), idKey(invite.id), ownedKey(invite.ownerId)], [
    JSON.stringify(invite),
    invite.slug,
    invite.id,
  ])
  return code as WriteCode
}

async function replaceInvite(previousSlug: string, next: InvitationRecord, expectedRevision: number): Promise<WriteCode> {
  if (kind() === 'file') return files.replaceInvite(previousSlug, next, expectedRevision)
  const code = await evalCode(
    REPLACE_INVITE,
    [inviteKey(previousSlug), inviteKey(next.slug), idKey(next.id), ownedKey(next.ownerId), legacyOwnerKey(next.ownerId)],
    [expectedRevision, JSON.stringify(next), next.ownerId, next.id, next.slug, previousSlug],
  )
  return code as WriteCode
}

async function removeInvite(ownerId: string, invite: InvitationRecord): Promise<WriteCode> {
  if (kind() === 'file') return files.removeInvite(ownerId, invite.id)
  const code = await evalCode(
    DELETE_INVITE,
    [inviteKey(invite.slug), idKey(invite.id), ownedKey(ownerId), legacyOwnerKey(ownerId)],
    [ownerId, invite.id, invite.slug],
  )
  return code as WriteCode
}

async function slugTaken(slug: string) {
  return Boolean(await getBySlug(slug))
}

async function freeSlug(seed: string) {
  let base = normalizeSlug(seed)
  if (slugError(base)) base = normalizeSlug(`${base || 'thiep'}-thiep`)
  if (slugError(base)) base = `thiep-${randomUUID().slice(0, 6)}`
  let candidate = base
  for (let n = 1; n < 40; n += 1) {
    if (!(await slugTaken(candidate))) return candidate
    const suffix = `-${n + 1}`
    candidate = `${base.slice(0, Math.max(0, 40 - suffix.length))}${suffix}`
  }
  return `thiep-${randomUUID().slice(0, 8)}`
}

async function insertFresh(ownerId: string, seed: string, build: (slug: string) => InvitationRecord) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = await freeSlug(attempt ? `${seed}-${randomUUID().slice(0, 4)}` : seed)
    const invite = build(slug)
    const code = await insertInvite(invite)
    if (code === 'slug') continue
    assertWrite(code)
    const stored = await getById(invite.id)
    if (!stored || stored.ownerId !== ownerId) throw new PlatformError('Không xác nhận được thiệp vừa tạo', 502)
    return stored
  }
  throw new PlatformError('Không tạo được đường dẫn riêng. Hãy thử lại.')
}

function requireId(id: string) {
  if (!isInvitationId(id)) throw new PlatformError('Không thấy thiệp', 404)
}

export function findUserById(id: string) {
  return locked(async () => {
    kind()
    if (kind() === 'file') return files.getUser(id)
    return inviteUser(await redisGet(userKey(id)))
  })
}

export function findUserByUsername(username: string) {
  return locked(async () => {
    kind()
    if (kind() === 'file') return files.getUserByUsername(username)
    const id = await redisGet(usernameKey(username))
    if (!id) return null
    return inviteUser(await redisGet(userKey(id)))
  })
}

async function userFromRedisIndex(key: string, match: (user: PlatformUser) => boolean) {
  const indexed = await redisGet(key)
  if (indexed) {
    const user = inviteUser(await redisGet(userKey(indexed)))
    if (user && match(user)) return user
  }
  const found = (await redisUsers()).find(match) ?? null
  if (found) await pipeline([['SET', key, found.id]])
  return found
}

export function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email)
  if (!normalized) return Promise.resolve(null)
  return locked(async () => {
    kind()
    if (kind() === 'file') return files.getUserByEmail(normalized)
    return userFromRedisIndex(emailKey(normalized), (user) => user.email === normalized)
  })
}

export function findUserByFacebookId(facebookId: string) {
  const id = facebookId.trim()
  if (!id) return Promise.resolve(null)
  return locked(async () => {
    kind()
    if (kind() === 'file') return files.getUserByFacebookId(id)
    return userFromRedisIndex(facebookKey(id), (user) => user.facebookId === id)
  })
}

function inviteUser(raw: string | null): PlatformUser | null {
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as PlatformUser
    if (typeof user.id !== 'string' || typeof user.username !== 'string' || typeof user.passwordHash !== 'string') return null
    if (user.role !== 'admin' && user.role !== 'member') return null
    return user
  } catch {
    return null
  }
}

export function countUsers() {
  return locked(async () => {
    kind()
    if (kind() === 'file') return (await files.listUsers()).length
    const [ids] = await pipeline([['SMEMBERS', USERS_INDEX]])
    return Array.isArray(ids) ? ids.length : 0
  })
}

export function getInvitationBySlug(slug: string) {
  return locked(async () => {
    kind()
    return getBySlug(slug)
  })
}

export function listOwnedInvitations(ownerId: string) {
  return locked(async () => {
    kind()
    return listByOwner(ownerId)
  })
}

export function getOwnedInvitation(ownerId: string, id: string) {
  return locked(async () => {
    kind()
    requireId(id)
    await absorbLegacy(ownerId)
    const invite = await getById(id)
    if (!invite || invite.ownerId !== ownerId) return null
    return invite
  })
}

export async function createUser(input: {
  username: string
  password: string
  name: string
  role: Role
  email?: string
  facebookId?: string
}) {
  const username = normalizeUsername(input.username)
  const name = input.name.trim().slice(0, 80)
  const email = input.email ? normalizeEmail(input.email) : ''
  const facebookId = input.facebookId?.trim() ?? ''
  if (!username) throw new PlatformError('Tên đăng nhập gồm 3–32 ký tự: chữ thường, số, dấu chấm hoặc gạch dưới')
  if (input.password.length < 6) throw new PlatformError('Mật khẩu cần ít nhất 6 ký tự')
  if (!name) throw new PlatformError('Hãy nhập tên người dùng')
  if (input.email && !email) throw new PlatformError('Email không hợp lệ')
  if (facebookId && !/^\d{1,32}$/.test(facebookId)) throw new PlatformError('Mã Facebook không hợp lệ')
  const passwordHash = await hashPassword(input.password)
  const user: PlatformUser = {
    id: randomUUID(),
    username,
    passwordHash,
    name,
    role: input.role,
    createdAt: new Date().toISOString(),
    ...(email ? { email } : {}),
    ...(facebookId ? { facebookId } : {}),
  }
  return locked(async () => {
    kind()
    if (kind() === 'file') {
      assertWrite(await files.insertUser(user))
    } else {
      assertWrite(
        await evalCode(
          INSERT_USER,
          [
            usernameKey(user.username),
            userKey(user.id),
            USERS_INDEX,
            email ? emailKey(email) : 'platform:skip-email',
            facebookId ? facebookKey(facebookId) : 'platform:skip-facebook',
          ],
          [JSON.stringify(user), user.id, email ? '1' : '0', facebookId ? '1' : '0'],
        ),
      )
    }
    const stored = kind() === 'file' ? await files.getUser(user.id) : inviteUser(await redisGet(userKey(user.id)))
    if (!stored || stored.username !== user.username) throw new PlatformError('Không xác nhận được tài khoản vừa tạo', 502)
    return stored
  })
}

export async function ensureSeedAdmin() {
  const username = process.env.PLATFORM_ADMIN_USERNAME
  const password = process.env.PLATFORM_ADMIN_PASSWORD
  if (!username || !password || password.length < 6 || !normalizeUsername(username)) return
  if (await findUserByUsername(normalizeUsername(username))) return
  try {
    await createUser({ username, password, name: 'Quản trị', role: 'admin' })
  } catch (error) {
    if (error instanceof PlatformError) return
    throw error
  }
}

export async function createInvitation(ownerId: string, templateId: TemplateId) {
  if (!isTemplateId(templateId)) throw new PlatformError('Mẫu thiệp không hợp lệ')
  return locked(async () => {
    kind()
    await assertRoom(ownerId)
    const user = kind() === 'file' ? await files.getUser(ownerId) : inviteUser(await redisGet(userKey(ownerId)))
    const seed = user?.username || 'thiep'
    return insertFresh(ownerId, seed, (slug) => ({
      id: randomUUID(),
      ownerId,
      slug,
      templateId,
      published: false,
      content: seededContent(templateId),
      updatedAt: new Date().toISOString(),
      revision: 1,
    }))
  })
}

export async function copyOwnedInvitation(ownerId: string, id: string) {
  return locked(async () => {
    kind()
    requireId(id)
    await absorbLegacy(ownerId)
    const source = await getById(id)
    if (!source || source.ownerId !== ownerId) throw new PlatformError('Không thấy thiệp', 404)
    await assertRoom(ownerId)
    const now = new Date().toISOString()
    const copied = await insertFresh(ownerId, `${source.slug}-ban-sao`, (slug) => planCopy(source, randomUUID(), slug, now))
    const again = await getById(source.id)
    if (!again || again.revision !== source.revision || again.slug !== source.slug) {
      throw new PlatformError('Không sao chép được vì thiệp gốc vừa thay đổi', 409)
    }
    return copied
  })
}

export async function saveOwnedInvitation(
  ownerId: string,
  id: string,
  input: { mode: SaveMode; baseRevision: number; slug: string; templateId: TemplateId; content: WeddingContent },
) {
  if (input.mode !== 'draft' && input.mode !== 'publish' && input.mode !== 'unpublish') {
    throw new PlatformError('Thao tác không hợp lệ')
  }
  if (!isTemplateId(input.templateId)) throw new PlatformError('Mẫu thiệp không hợp lệ')
  if (typeof input.baseRevision !== 'number' || !Number.isInteger(input.baseRevision) || input.baseRevision < 0) {
    throw new PlatformError('Thiếu phiên bản thiệp')
  }
  const slug = normalizeSlug(input.slug)
  const slugProblem = slugError(slug)
  if (slugProblem) throw new PlatformError(slugProblem)
  const content = structuredClone(input.content)
  const contentProblem = sanitizeContent(content)
  if (contentProblem) throw new PlatformError(contentProblem)

  return locked(async () => {
    kind()
    requireId(id)
    await absorbLegacy(ownerId)
    const previous = await getById(id)
    if (!previous || previous.ownerId !== ownerId) throw new PlatformError('Không thấy thiệp', 404)
    if (previous.revision !== input.baseRevision) {
      throw new PlatformError('Thiệp vừa được lưu ở một phiên khác. Hãy tải lại trang trước khi sửa tiếp.', 409)
    }
    if (input.mode === 'publish') {
      const owner = kind() === 'file' ? await files.getUser(ownerId) : inviteUser(await redisGet(userKey(ownerId)))
      const orders = await listOrders(ownerId)
      if (!canPublishFor(orders, owner?.role ?? 'member', ownerId, id, previous.published)) {
        throw new PlatformError('Thiệp này chưa thanh toán. Hãy mua gói Một thiệp hoặc Studio trước khi xuất bản.', 402)
      }
      if (owner?.role !== 'admin' && isArchived(content.event.end)) {
        throw new PlatformError('Đã quá 45 ngày sau lễ, không xuất bản thêm.')
      }
    }
    await assertMediaOwned(ownerId, content)
    const next = planInvitationWrite(previous, { mode: input.mode, slug, templateId: input.templateId, content }, new Date().toISOString())
    assertWrite(await replaceInvite(previous.slug, next, previous.revision))
    if (input.mode === 'publish') await markMediaPublic(collectMediaIds(publicContent(next)))
    const stored = await getById(next.id)
    if (!stored || stored.revision !== next.revision || stored.slug !== next.slug || stored.published !== next.published) {
      throw new PlatformError('Không xác nhận được dữ liệu vừa lưu', 502)
    }
    return stored
  })
}

export async function deleteOwnedInvitation(ownerId: string, id: string) {
  return locked(async () => {
    kind()
    requireId(id)
    await absorbLegacy(ownerId)
    const invite = await getById(id)
    if (!invite || invite.ownerId !== ownerId) throw new PlatformError('Không thấy thiệp', 404)
    let code = await removeInvite(ownerId, invite)
    if (code === 'missing') {
      const again = await getById(id)
      if (!again || again.ownerId !== ownerId) return
      code = await removeInvite(ownerId, again)
    }
    assertWrite(code)
    const still = await getById(id)
    if (still) throw new PlatformError('Không xác nhận được việc xóa thiệp', 502)
  })
}

export async function createMember(input: { username: string; password: string; name: string; email?: string }) {
  const user = await createUser({ ...input, role: 'member' })
  return toPublicUser(user)
}

async function unusedUsername(source: string) {
  const seed = usernameSeed(source).slice(0, 28)
  for (let index = 0; index < 30; index += 1) {
    const candidate = normalizeUsername(index === 0 ? seed : `${seed}${index}`.slice(0, 32))
    if (candidate && !(await findUserByUsername(candidate))) return candidate
  }
  throw new PlatformError('Không tạo được tài khoản. Hãy thử lại.')
}

/** Đăng ký công khai: email là tên tài khoản. Tên đăng nhập được đặt phía sau. */
export async function createMemberByEmail(input: { name: string; email: string; password: string }) {
  const email = normalizeEmail(input.email)
  if (!email) throw new PlatformError('Hãy nhập email hợp lệ')
  return toPublicUser(await createWithFreeUsername(email.split('@')[0] ?? email, {
    password: input.password,
    name: input.name,
    role: 'member',
    email,
  }))
}

async function createWithFreeUsername(
  source: string,
  input: { password: string; name: string; role: Role; email?: string; facebookId?: string },
) {
  let last: unknown
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = await unusedUsername(source)
    try {
      return await createUser({ username, ...input })
    } catch (error) {
      last = error
      if (!(error instanceof PlatformError) || error.message !== 'Tên đăng nhập đã có người dùng') throw error
    }
  }
  if (last instanceof PlatformError) throw last
  throw new PlatformError('Không tạo được tài khoản. Hãy thử lại.')
}

/** Vào bằng Facebook. Tài khoản cùng email được nối, chưa có thì tạo mới. */
export async function signInWithFacebook(profile: { id: string; name: string; email?: string }) {
  const facebookId = profile.id.trim()
  if (!/^\d{1,32}$/.test(facebookId)) throw new PlatformError('Facebook không trả về mã người dùng')
  const email = profile.email ? normalizeEmail(profile.email) : ''
  const name = profile.name.trim().slice(0, 80) || 'Khách Facebook'
  const linked = await findUserByFacebookId(facebookId)
  if (linked) return toPublicUser(linked)
  if (email) {
    const byEmail = await findUserByEmail(email)
    if (byEmail) {
      if (byEmail.facebookId && byEmail.facebookId !== facebookId) {
        throw new PlatformError('Email này đã nối với một tài khoản Facebook khác')
      }
      await attachFacebook(byEmail.id, facebookId)
      return toPublicUser({ ...byEmail, facebookId })
    }
  }
  const user = await createWithFreeUsername(email ? (email.split('@')[0] ?? email) : `fb${facebookId.slice(-8)}`, {
    password: randomBytes(24).toString('base64url'),
    name,
    role: 'member',
    email: email || undefined,
    facebookId,
  })
  return toPublicUser(user)
}

async function attachFacebook(userId: string, facebookId: string) {
  const current = await findUserById(userId)
  if (!current) throw new PlatformError('Không thấy tài khoản', 404)
  const taken = await findUserByFacebookId(facebookId)
  if (taken && taken.id !== current.id) throw new PlatformError('Tài khoản Facebook này đã được nối')
  await writeUser({ ...current, facebookId })
}

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  return locked(async () => {
    kind()
    const users = kind() === 'file' ? await files.listUsers() : await redisUsers()
    const rows: AdminUserRow[] = []
    for (const user of users) {
      const invites = await listByOwner(user.id)
      rows.push({
        ...toPublicUser(user),
        invitations: invites.map((invite) => ({
          slug: invite.slug,
          published: invite.published,
          templateId: invite.templateId,
        })),
      })
    }
    rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return rows
  })
}

async function redisUsers() {
  const [ids] = await pipeline([['SMEMBERS', USERS_INDEX]])
  const list = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
  if (!list.length) return []
  const rows = await pipeline(list.map((id) => ['GET', userKey(id)]))
  return rows.map((row) => inviteUser(typeof row === 'string' ? row : null)).filter((user): user is PlatformUser => user !== null)
}

async function writeUser(next: PlatformUser) {
  if (kind() === 'file') {
    await files.putUser(next)
    return
  }
  const previous = inviteUser(await redisGet(userKey(next.id)))
  if (next.email) {
    const owner = await redisGet(emailKey(next.email))
    if (owner && owner !== next.id) throw new PlatformError('Email này đã có tài khoản. Hãy đăng nhập.')
  }
  if (next.facebookId) {
    const owner = await redisGet(facebookKey(next.facebookId))
    if (owner && owner !== next.id) throw new PlatformError('Tài khoản Facebook này đã được nối')
  }
  const commands: (string | number)[][] = [
    ['SET', userKey(next.id), JSON.stringify(next)],
    ['SET', usernameKey(next.username), next.id],
    ['SADD', USERS_INDEX, next.id],
  ]
  if (previous?.email && previous.email !== next.email) commands.push(['DEL', emailKey(previous.email)])
  if (next.email) commands.push(['SET', emailKey(next.email), next.id])
  if (previous?.facebookId && previous.facebookId !== next.facebookId) commands.push(['DEL', facebookKey(previous.facebookId)])
  if (next.facebookId) commands.push(['SET', facebookKey(next.facebookId), next.id])
  const [result] = await pipeline(commands)
  if (result !== 'OK') throw new PlatformError('Không lưu được tài khoản', 502)
}

export async function setRecoveryHash(id: string, recoveryHash: string | null) {
  return locked(async () => {
    kind()
    const user = kind() === 'file' ? await files.getUser(id) : inviteUser(await redisGet(userKey(id)))
    if (!user) throw new PlatformError('Không thấy tài khoản', 404)
    const next = { ...user }
    if (recoveryHash) next.recoveryHash = recoveryHash
    else delete next.recoveryHash
    await writeUser(next)
  })
}

export async function setUserPassword(id: string, password: string) {
  if (password.length < 6) throw new PlatformError('Mật khẩu cần ít nhất 6 ký tự')
  const passwordHash = await hashPassword(password)
  return locked(async () => {
    kind()
    const user = kind() === 'file' ? await files.getUser(id) : inviteUser(await redisGet(userKey(id)))
    if (!user) throw new PlatformError('Không thấy tài khoản', 404)
    const next = { ...user, passwordHash }
    await writeUser(next)
  })
}

export async function deleteUserById(id: string) {
  return locked(async () => {
    kind()
    const users = kind() === 'file' ? await files.listUsers() : await redisUsers()
    const user = users.find((item) => item.id === id)
    if (!user) throw new PlatformError('Không thấy tài khoản', 404)
    if (user.role === 'admin' && users.filter((item) => item.role === 'admin').length <= 1) {
      throw new PlatformError('Cần giữ ít nhất một tài khoản quản trị')
    }
    const invites = await listByOwner(id)
    for (const invite of invites) {
      const code = await removeInvite(id, invite)
      if (code === 'missing') continue
      assertWrite(code)
    }
    await deleteMediaForOwner(id)
    if (kind() === 'file') {
      await files.deleteUser(id)
    } else {
      const drop: (string | number)[][] = [
        ['DEL', userKey(user.id)],
        ['DEL', usernameKey(user.username)],
        ['SREM', USERS_INDEX, user.id],
      ]
      if (user.email) drop.push(['DEL', emailKey(user.email)])
      if (user.facebookId) drop.push(['DEL', facebookKey(user.facebookId)])
      await pipeline(drop)
    }
    const still = kind() === 'file' ? await files.getUser(id) : inviteUser(await redisGet(userKey(id)))
    if (still) throw new PlatformError('Không xác nhận được việc xóa tài khoản', 502)
  })
}

export async function snapshotPlatform() {
  return locked(async () => {
    kind()
    const users = kind() === 'file' ? await files.listUsers() : await redisUsers()
    const invitations: InvitationRecord[] = []
    for (const user of users) invitations.push(...(await listByOwner(user.id)))
    return { users, invitations }
  })
}

export async function installSnapshot(users: PlatformUser[], invitations: InvitationRecord[]) {
  return locked(async () => {
    kind()
    if (kind() === 'file') {
      await files.replaceAll(users, invitations)
      return
    }
    const commands: (string | number)[][] = []
    for (const user of users) {
      commands.push(['SET', userKey(user.id), JSON.stringify(user)])
      commands.push(['SET', usernameKey(user.username), user.id])
      commands.push(['SADD', USERS_INDEX, user.id])
      if (user.email) commands.push(['SET', emailKey(user.email), user.id])
      if (user.facebookId) commands.push(['SET', facebookKey(user.facebookId), user.id])
    }
    for (const invite of invitations) {
      commands.push(['SET', inviteKey(invite.slug), JSON.stringify(invite)])
      commands.push(['SET', idKey(invite.id), invite.slug])
      commands.push(['SADD', ownedKey(invite.ownerId), invite.id])
    }
    if (commands.length) await pipeline(commands)
  })
}
