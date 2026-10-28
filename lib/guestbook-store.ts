import { GUESTBOOK_LIMITS, type GuestbookEntry } from './guestbook'
import { allowAttempt, isRedisConfigured, pipeline } from './redis'

export { clientIp, rejectIfWrongPassword } from './redis'

const LIST_KEY = 'guestbook:entries'
const listKey = (scope?: string) => (scope ? `platform:guestbook:${scope}` : LIST_KEY)
const MAX_STORED = 1000
const MAX_SHOWN = 300
const RATE_LIMIT = { max: 5, windowSeconds: 600 }

export const isGuestbookConfigured = isRedisConfigured

type StoredEntry = GuestbookEntry & { id: string }

function parse(raw: unknown): StoredEntry | null {
  if (typeof raw !== 'string') return null
  try {
    const v = JSON.parse(raw) as Partial<StoredEntry>
    if (typeof v.id !== 'string' || typeof v.name !== 'string' || typeof v.message !== 'string') return null
    if (typeof v.createdAt !== 'string') return null
    return { id: v.id, name: v.name, message: v.message, createdAt: v.createdAt }
  } catch {
    return null
  }
}

export async function listEntries(scope?: string): Promise<StoredEntry[]> {
  const [raw] = await pipeline([['LRANGE', listKey(scope), 0, MAX_SHOWN - 1]])
  return Array.isArray(raw) ? raw.map(parse).filter((e): e is StoredEntry => e !== null) : []
}

export function cleanName(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, GUESTBOOK_LIMITS.name)
}

export function cleanMessage(value: unknown) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, GUESTBOOK_LIMITS.message)
}

export const allowSubmission = (ip: string, scope?: string) =>
  allowAttempt(scope ? `platform:guestbook-rate:${scope}:${ip}` : `guestbook:rate:${ip}`, RATE_LIMIT)

export async function addEntry(name: string, message: string, scope?: string): Promise<StoredEntry> {
  const entry: StoredEntry = { id: crypto.randomUUID(), name, message, createdAt: new Date().toISOString() }
  await pipeline([
    ['LPUSH', listKey(scope), JSON.stringify(entry)],
    ['LTRIM', listKey(scope), 0, MAX_STORED - 1],
  ])
  return entry
}

export async function deleteEntry(id: string, scope?: string) {
  const key = listKey(scope)
  const [raw] = await pipeline([['LRANGE', key, 0, -1]])
  const match = Array.isArray(raw) ? raw.find((r) => parse(r)?.id === id) : undefined
  if (typeof match !== 'string') return false
  const [removed] = await pipeline([['LREM', key, 1, match]])
  return Number(removed) > 0
}
