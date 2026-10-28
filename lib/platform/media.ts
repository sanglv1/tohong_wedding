import { randomBytes } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { WeddingContent } from '@/lib/content'
import { isRedisConfigured, pipeline, redisEval } from '@/lib/redis'
import { logPlatformFailure, PlatformError } from './errors'
import { sniffImage } from './image-type'
import { collectMediaIds } from './media-ids'
import {
  deleteObject,
  getObject,
  mediaWriteBackend,
  objectExists,
  objectKey,
  putObject,
  readObjectStorageConfig,
} from './object-store'
import { storageKind } from './storage-mode'
import type { Role } from './types'

const DIR = join(process.cwd(), 'data', 'media')
/** Vercel nhận thân request tối đa khoảng 4,5 MB */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_MEDIA_PER_USER = 400

const ID_RE = /^[A-Za-z0-9_-]{16}$/

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'audio/mpeg' | 'audio/mp4'
type MediaMeta = { t: MediaType; o?: string; pub?: boolean }
type MediaBlob = { type: MediaType; bytes: Buffer }

const MEDIA_TYPES = new Set<MediaType>(['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4'])

function asMediaType(value: unknown): MediaType | null {
  return typeof value === 'string' && MEDIA_TYPES.has(value as MediaType) ? (value as MediaType) : null
}

export function sniffAudio(bytes: Uint8Array): 'audio/mpeg' | 'audio/mp4' | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return 'audio/mpeg'
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return 'audio/mpeg'
  const mark = String.fromCharCode(bytes[4] ?? 0, bytes[5] ?? 0, bytes[6] ?? 0, bytes[7] ?? 0)
  if (mark === 'ftyp') return 'audio/mp4'
  return null
}

export { sniffImage }

function assertWritable() {
  storageKind({
    redis: isRedisConfigured,
    production: process.env.NODE_ENV === 'production',
    vercel: process.env.VERCEL === '1',
  })
}

function bytesBackend() {
  return mediaWriteBackend({
    objectStorage: Boolean(readObjectStorageConfig()),
    production: process.env.NODE_ENV === 'production',
    vercel: process.env.VERCEL === '1',
  })
}

function metaKey(id: string) {
  return `platform:media-meta:${id}`
}
function blobKey(id: string) {
  return `platform:media:${id}`
}
function ownerKey(ownerId: string) {
  return `platform:user-media:${ownerId}`
}

function newId() {
  return randomBytes(12).toString('base64url')
}

export function mediaUrl(id: string) {
  return `/api/media/${id}`
}

/** Redis chỉ giữ mô tả và danh sách của chủ. Byte nằm ở object storage hoặc file máy dev. */
const SAVE_MEDIA_META = `
redis.call('SET', KEYS[1], ARGV[1])
redis.call('SADD', KEYS[2], ARGV[2])
return 'ok'
`

export async function saveMedia(ownerId: string, bytes: Buffer) {
  assertWritable()
  if (bytes.length === 0) throw new PlatformError('File ảnh trống')
  if (bytes.length > MAX_IMAGE_BYTES) throw new PlatformError('Ảnh quá 4 MB', 413)
  const type = sniffImage(bytes)
  if (!type) throw new PlatformError('Chỉ nhận ảnh JPG, PNG hoặc WEBP')
  return storeOwned(ownerId, bytes, type, 'Không lưu được ảnh')
}

export async function saveAudio(ownerId: string, bytes: Buffer) {
  assertWritable()
  if (bytes.length === 0) throw new PlatformError('File nhạc trống')
  if (bytes.length > MAX_IMAGE_BYTES) throw new PlatformError('Nhạc quá 4 MB', 413)
  const type = sniffAudio(bytes)
  if (!type) throw new PlatformError('Chỉ nhận nhạc MP3 hoặc M4A')
  return storeOwned(ownerId, bytes, type, 'Không lưu được nhạc')
}

async function storeOwned(ownerId: string, bytes: Buffer, type: MediaType, failure: string) {
  if ((await countMedia(ownerId)) >= MAX_MEDIA_PER_USER) {
    throw new PlatformError('Tài khoản đã đủ số file cho phép')
  }
  const id = newId()
  const meta: MediaMeta = { t: type, o: ownerId }
  const backend = bytesBackend()
  if (backend === 'object') await putObject(objectKey(id), bytes, type)
  else await writeFileBytes(id, bytes)
  try {
    await writeMeta(id, meta)
  } catch (error) {
    if (backend === 'object') await deleteObject(objectKey(id)).catch((cleanup) => logPlatformFailure(cleanup))
    else await rm(join(DIR, id), { force: true }).catch((cleanup) => logPlatformFailure(cleanup))
    if (error instanceof PlatformError) throw error
    throw new PlatformError(failure, 502)
  }
  return mediaUrl(id)
}

async function countMedia(ownerId: string) {
  if (isRedisConfigured) {
    const [count] = await pipeline([['SCARD', ownerKey(ownerId)]])
    return Number(count) || 0
  }
  try {
    const names = await readdir(DIR)
    let total = 0
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const meta = await readMetaFile(name.slice(0, -5))
      if (meta?.o === ownerId) total += 1
    }
    return total
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0
    throw error
  }
}

async function writeMeta(id: string, meta: MediaMeta) {
  if (!isRedisConfigured) {
    await mkdir(DIR, { recursive: true })
    await writeFile(join(DIR, `${id}.json`), JSON.stringify(meta), 'utf8')
    return
  }
  if (!meta.o) {
    const [result] = await pipeline([['SET', metaKey(id), JSON.stringify(meta)]])
    if (result !== 'OK') throw new PlatformError('Không lưu được quyền xem file', 502)
    return
  }
  const result = await redisEval(SAVE_MEDIA_META, [metaKey(id), ownerKey(meta.o)], [JSON.stringify(meta), id])
  if (result !== 'ok') throw new PlatformError('Không lưu được quyền xem file', 502)
}

async function writeFileBytes(id: string, bytes: Buffer) {
  try {
    await mkdir(DIR, { recursive: true })
    await writeFile(join(DIR, id), bytes)
    const check = await readFile(join(DIR, id))
    if (check.length !== bytes.length) throw new PlatformError('Không xác nhận được file vừa lưu', 502)
  } catch (error) {
    if (error instanceof PlatformError) throw error
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'EROFS' || code === 'EPERM' || code === 'EACCES') {
      throw new PlatformError('Máy chủ không ghi được file. Hãy gắn object storage để lưu ảnh và nhạc.', 503)
    }
    throw error
  }
}

async function readMeta(id: string): Promise<MediaMeta | null> {
  if (!ID_RE.test(id)) return null
  if (isRedisConfigured) {
    const [raw] = await pipeline([['GET', metaKey(id)]])
    if (typeof raw !== 'string') return null
    return parseMeta(raw)
  }
  return readMetaFile(id)
}

async function readMetaFile(id: string): Promise<MediaMeta | null> {
  try {
    return parseMeta(await readFile(join(DIR, `${id}.json`), 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

function parseMeta(raw: string): MediaMeta | null {
  try {
    const parsed = JSON.parse(raw) as MediaMeta
    const type = asMediaType(parsed.t)
    if (!type) return null
    return { t: type, o: typeof parsed.o === 'string' ? parsed.o : undefined, pub: parsed.pub === true }
  } catch {
    return null
  }
}

async function mediaExists(id: string) {
  const config = readObjectStorageConfig()
  if (config) {
    try {
      if (await objectExists(objectKey(id), config)) return true
    } catch (error) {
      logPlatformFailure(error)
    }
  }
  if (isRedisConfigured) {
    const [meta, blob] = await pipeline([
      ['EXISTS', metaKey(id)],
      ['EXISTS', blobKey(id)],
    ])
    if (Number(meta) === 1 || Number(blob) === 1) return true
  }
  try {
    await readFile(join(DIR, id))
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

export async function assertMediaOwned(ownerId: string, content: WeddingContent) {
  for (const id of collectMediaIds(content)) {
    const meta = await readMeta(id)
    if (!meta) {
      if (await mediaExists(id)) continue
      throw new PlatformError('Một ảnh không còn trên hệ thống. Hãy tải lại.')
    }
    if (meta.o && meta.o !== ownerId) throw new PlatformError('Ảnh không thuộc tài khoản này', 403)
  }
}

export async function markMediaPublic(ids: string[]) {
  for (const id of ids) {
    const meta = await readMeta(id)
    if (!meta || meta.pub) continue
    meta.pub = true
    await writeMeta(id, meta)
  }
}

async function removeLocalCopies(ids: string[]) {
  for (const id of ids) {
    await rm(join(DIR, id), { force: true }).catch(() => undefined)
    await rm(join(DIR, `${id}.json`), { force: true }).catch(() => undefined)
    await rm(join(DIR, `${id}.type`), { force: true }).catch(() => undefined)
  }
}

export async function deleteMediaForOwner(ownerId: string) {
  assertWritable()
  if (isRedisConfigured) {
    const [ids] = await pipeline([['SMEMBERS', ownerKey(ownerId)]])
    const list = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && ID_RE.test(id)) : []
    const config = readObjectStorageConfig()
    if (config) {
      for (const id of list) await deleteObject(objectKey(id), config)
    }
    const commands: (string | number)[][] = list.flatMap((id) => [
      ['DEL', blobKey(id)],
      ['DEL', metaKey(id)],
    ])
    commands.push(['DEL', ownerKey(ownerId)])
    await pipeline(commands)
    await removeLocalCopies(list)
    return
  }
  let names: string[] = []
  try {
    names = await readdir(DIR)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const id = name.slice(0, -5)
    if (!ID_RE.test(id)) continue
    const meta = await readMetaFile(id)
    if (meta?.o !== ownerId) continue
    await rm(join(DIR, id), { force: true })
    await rm(join(DIR, `${id}.json`), { force: true })
    await rm(join(DIR, `${id}.type`), { force: true })
  }
}

export async function readMedia(
  id: string,
  viewer: { id: string; role: Role } | null,
): Promise<{ type: string; bytes: Buffer; isPublic: boolean } | null> {
  if (!ID_RE.test(id)) return null
  assertWritable()
  const meta = await readMeta(id)
  const legacy = !meta
  if (meta?.o && meta.o !== viewer?.id && viewer?.role !== 'admin' && !meta.pub) return null
  const blob = await readBlob(id, meta?.t)
  if (!blob) return null
  return { type: blob.type, bytes: blob.bytes, isPublic: legacy || !meta?.o || meta.pub === true }
}

function describe(bytes: Buffer, hinted?: MediaType): MediaBlob | null {
  const type = (hinted && asMediaType(hinted)) || sniffImage(bytes) || sniffAudio(bytes)
  if (!type) return null
  return { type, bytes }
}

async function readRedisBlob(id: string): Promise<MediaBlob | null> {
  if (!isRedisConfigured) return null
  const [raw] = await pipeline([['GET', blobKey(id)]])
  if (typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw) as { t?: unknown; d?: unknown }
    const type = asMediaType(parsed.t)
    if (!type || typeof parsed.d !== 'string') return null
    return { type, bytes: Buffer.from(parsed.d, 'base64') }
  } catch {
    return null
  }
}

/** Ảnh cũ còn nằm trong Redis được copy sang bucket ở lần mở, rồi xóa byte trên Redis. */
async function migrateLegacy(id: string, legacy: MediaBlob) {
  const config = readObjectStorageConfig()
  if (!config) return
  try {
    await putObject(objectKey(id), legacy.bytes, legacy.type, config)
    await pipeline([['DEL', blobKey(id)]])
  } catch (error) {
    logPlatformFailure(error)
  }
}

async function readFileBlob(id: string, hinted?: MediaType): Promise<MediaBlob | null> {
  try {
    const bytes = await readFile(join(DIR, id))
    const typed = describe(bytes, hinted)
    if (typed) return typed
    const legacyType = asMediaType((await readFile(join(DIR, `${id}.type`), 'utf8')).trim())
    if (!legacyType) return null
    return { type: legacyType, bytes }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function readBlob(id: string, hinted?: MediaType): Promise<MediaBlob | null> {
  const config = readObjectStorageConfig()
  if (config) {
    try {
      const stored = await getObject(objectKey(id), config)
      if (stored) {
        const typed = describe(stored, hinted)
        if (typed) return typed
      }
    } catch (error) {
      logPlatformFailure(error)
    }
  }
  const legacy = await readRedisBlob(id)
  if (legacy) {
    await migrateLegacy(id, legacy)
    return legacy
  }
  return readFileBlob(id, hinted)
}
