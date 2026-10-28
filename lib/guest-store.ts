import { guestKey } from './guest'
import type { GuestOpens, GuestRecord } from './guests'
import { allowAttempt, hashValues, pipeline } from './redis'

const LIST_KEY = 'guests:list'
const OPENS_KEY = 'guests:opens'
const listKey = (scope?: string) => (scope ? `platform:guests:${scope}` : LIST_KEY)
const opensKey = (scope?: string) => (scope ? `platform:guest-opens:${scope}` : OPENS_KEY)
const MAX_NAME = 60
const MAX_BATCH = 500
const OPEN_LIMIT = { max: 30, windowSeconds: 600 }

export const allowOpen = (ip: string, scope?: string) =>
  allowAttempt(scope ? `platform:open-rate:${scope}:${ip}` : `guests:open-rate:${ip}`, OPEN_LIMIT)

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function listGuests(scope?: string): Promise<GuestRecord[]> {
  const [list, opens] = await pipeline([
    ['HGETALL', listKey(scope)],
    ['HGETALL', opensKey(scope)],
  ])
  const openMap = new Map<string, GuestOpens>()
  if (Array.isArray(opens)) {
    for (let i = 0; i + 1 < opens.length; i += 2) {
      const value = parseJson<GuestOpens>(String(opens[i + 1]))
      if (value) openMap.set(String(opens[i]), value)
    }
  }
  return hashValues(list)
    .map((raw) => parseJson<GuestRecord>(raw))
    .filter((g): g is GuestRecord => g !== null && typeof g.key === 'string')
    .map((g) => ({ ...g, opens: openMap.get(g.key) }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Thêm khách (tên đã có thì giữ nguyên); trả về số khách mới */
export async function addGuests(names: unknown[], scope?: string) {
  const now = Date.now()
  const commands = names
    .map((n) => String(n ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME))
    .filter(Boolean)
    .slice(0, MAX_BATCH)
    .map((name, i) => {
      const record: GuestRecord = { key: guestKey(name), name, createdAt: new Date(now + i).toISOString() }
      return ['HSETNX', listKey(scope), record.key, JSON.stringify(record)]
    })
  if (commands.length === 0) return 0
  const results = await pipeline(commands)
  return results.filter((r) => Number(r) === 1).length
}

export async function deleteGuest(key: string, scope?: string) {
  const [removed] = await pipeline([
    ['HDEL', listKey(scope), key],
    ['HDEL', opensKey(scope), key],
  ])
  return Number(removed) > 0
}

/** Ghi nhận khách mở thiệp - chỉ với tên có trong danh sách khách mời */
export async function recordOpen(name: string, scope?: string) {
  const key = guestKey(name)
  const [exists, raw] = await pipeline([
    ['HEXISTS', listKey(scope), key],
    ['HGET', opensKey(scope), key],
  ])
  if (Number(exists) !== 1) return false
  const now = new Date().toISOString()
  const prev = typeof raw === 'string' ? parseJson<GuestOpens>(raw) : null
  const opens: GuestOpens = { first: prev?.first ?? now, last: now, count: (prev?.count ?? 0) + 1 }
  await pipeline([['HSET', opensKey(scope), key, JSON.stringify(opens)]])
  return true
}
