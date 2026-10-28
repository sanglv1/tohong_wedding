import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { guestKey } from '@/lib/guest'
import { addGuests, allowOpen, deleteGuest, listGuests, recordOpen } from '@/lib/guest-store'
import type { GuestOpens, GuestRecord } from '@/lib/guests'
import { addEntry, allowSubmission, cleanMessage, cleanName, deleteEntry, listEntries } from '@/lib/guestbook-store'
import { allowRsvp, cleanRsvp, deleteRsvp, listRsvps, saveRsvp } from '@/lib/rsvp-store'
import type { RsvpEntry } from '@/lib/rsvp'
import { isRedisConfigured, pipeline } from '@/lib/redis'
import { PlatformError } from './errors'
import { isInvitationId } from './store'
import { storageKind } from './storage-mode'

type Wish = { id: string; name: string; message: string; createdAt: string }
type Bag = {
  rsvp: Record<string, Record<string, RsvpEntry>>
  wishes: Record<string, Wish[]>
  guests: Record<string, GuestRecord[]>
  opens: Record<string, Record<string, GuestOpens>>
}

const FILE = join(process.cwd(), 'data', 'engagement.json')
const empty = (): Bag => ({ rsvp: {}, wishes: {}, guests: {}, opens: {} })
const hits = new Map<string, number[]>()
let queue: Promise<void> = Promise.resolve()

function assertStore() {
  storageKind({
    redis: isRedisConfigured,
    production: process.env.NODE_ENV === 'production',
    vercel: process.env.VERCEL === '1',
  })
}

function scopeOf(id: string) {
  if (!isInvitationId(id)) throw new PlatformError('Thiệp không hợp lệ', 404)
  return id
}

function allowMemory(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const prev = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  if (prev.length >= max) return false
  prev.push(now)
  hits.set(key, prev)
  return true
}

async function gate(scope: string, ip: string, kind: 'rsvp' | 'wish' | 'open') {
  if (isRedisConfigured) {
    const ok =
      kind === 'rsvp' ? await allowRsvp(ip, scope) : kind === 'wish' ? await allowSubmission(ip, scope) : await allowOpen(ip, scope)
    if (!ok) throw new PlatformError('Bạn gửi hơi nhanh, vui lòng thử lại sau ít phút', 429)
    return
  }
  const max = kind === 'open' ? 30 : 5
  if (!allowMemory(`${kind}:${scope}:${ip}`, max, 600_000)) {
    throw new PlatformError('Bạn gửi hơi nhanh, vui lòng thử lại sau ít phút', 429)
  }
}

function locked<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function readBag(): Promise<Bag> {
  try {
    const data = JSON.parse(await readFile(FILE, 'utf8')) as Bag
    return {
      rsvp: data.rsvp ?? {},
      wishes: data.wishes ?? {},
      guests: data.guests ?? {},
      opens: data.opens ?? {},
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty()
    throw error
  }
}

async function writeBag(bag: Bag) {
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(FILE, `${JSON.stringify(bag)}\n`, 'utf8')
}

export async function submitRsvp(scope: string, body: Record<string, unknown>, ip: string) {
  assertStore()
  const id = scopeOf(scope)
  const input = cleanRsvp(body)
  if (typeof input === 'string') throw new PlatformError(input, 400)
  await gate(id, ip, 'rsvp')
  if (isRedisConfigured) return saveRsvp(input, id)
  return locked(async () => {
    const bag = await readBag()
    const bucket = bag.rsvp[id] ?? {}
    const now = new Date().toISOString()
    const entry: RsvpEntry = { ...input, createdAt: bucket[input.id]?.createdAt ?? now, updatedAt: now }
    bucket[input.id] = entry
    bag.rsvp[id] = bucket
    await writeBag(bag)
    return entry
  })
}

export async function rsvpList(scope: string) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return listRsvps(id)
  const bag = await readBag()
  return Object.values(bag.rsvp[id] ?? {}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function rsvpRemove(scope: string, entryId: string) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return deleteRsvp(entryId, id)
  return locked(async () => {
    const bag = await readBag()
    const bucket = bag.rsvp[id]
    if (!bucket?.[entryId]) return false
    delete bucket[entryId]
    await writeBag(bag)
    return true
  })
}

export async function wishList(scope: string) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return listEntries(id)
  const bag = await readBag()
  return (bag.wishes[id] ?? []).slice(0, 300)
}

export async function wishAdd(scope: string, name: string, message: string, ip: string) {
  assertStore()
  const id = scopeOf(scope)
  const clean = cleanName(name)
  const text = cleanMessage(message)
  if (!clean || !text) throw new PlatformError('Vui lòng nhập tên và lời chúc', 400)
  await gate(id, ip, 'wish')
  if (isRedisConfigured) return addEntry(clean, text, id)
  return locked(async () => {
    const bag = await readBag()
    const entry: Wish = { id: crypto.randomUUID(), name: clean, message: text, createdAt: new Date().toISOString() }
    const list = [entry, ...(bag.wishes[id] ?? [])].slice(0, 1000)
    bag.wishes[id] = list
    await writeBag(bag)
    return entry
  })
}

export async function wishRemove(scope: string, entryId: string) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return deleteEntry(entryId, id)
  return locked(async () => {
    const bag = await readBag()
    const list = bag.wishes[id] ?? []
    const next = list.filter((item) => item.id !== entryId)
    if (next.length === list.length) return false
    bag.wishes[id] = next
    await writeBag(bag)
    return true
  })
}

function withOpens(guests: GuestRecord[], opens: Record<string, GuestOpens>) {
  return guests.map((guest) => ({ ...guest, opens: opens[guest.key] }))
}

export async function guestList(scope: string) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return listGuests(id)
  const bag = await readBag()
  return withOpens(bag.guests[id] ?? [], bag.opens[id] ?? {})
}

export async function guestAdd(scope: string, names: unknown[]) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return addGuests(names, id)
  return locked(async () => {
    const bag = await readBag()
    const current = bag.guests[id] ?? []
    const known = new Set(current.map((guest) => guest.key))
    let added = 0
    const now = Date.now()
    for (const raw of names.slice(0, 500)) {
      const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
      if (!name) continue
      const key = guestKey(name)
      if (known.has(key)) continue
      known.add(key)
      current.push({ key, name, createdAt: new Date(now + added).toISOString() })
      added += 1
    }
    bag.guests[id] = current
    await writeBag(bag)
    return added
  })
}

export async function guestRemove(scope: string, key: string) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) return deleteGuest(key, id)
  return locked(async () => {
    const bag = await readBag()
    const list = bag.guests[id] ?? []
    const next = list.filter((guest) => guest.key !== key)
    if (next.length === list.length) return false
    bag.guests[id] = next
    if (bag.opens[id]) delete bag.opens[id][key]
    await writeBag(bag)
    return true
  })
}

export async function guestOpened(scope: string, name: string, ip: string) {
  assertStore()
  const id = scopeOf(scope)
  await gate(id, ip, 'open')
  if (isRedisConfigured) return recordOpen(name, id)
  return locked(async () => {
    const bag = await readBag()
    const key = guestKey(name)
    if (!(bag.guests[id] ?? []).some((guest) => guest.key === key)) return false
    const opens = bag.opens[id] ?? {}
    const prev = opens[key]
    const now = new Date().toISOString()
    opens[key] = { first: prev?.first ?? now, last: now, count: (prev?.count ?? 0) + 1 }
    bag.opens[id] = opens
    await writeBag(bag)
    return true
  })
}

export async function replaceEngagement(
  scope: string,
  data: { rsvps: RsvpEntry[]; wishes: Wish[]; guests: GuestRecord[] },
) {
  assertStore()
  const id = scopeOf(scope)
  if (isRedisConfigured) {
    const commands: (string | number)[][] = [
      ['DEL', `platform:rsvp:${id}`],
      ['DEL', `platform:guestbook:${id}`],
      ['DEL', `platform:guests:${id}`],
      ['DEL', `platform:guest-opens:${id}`],
    ]
    for (const entry of data.rsvps) commands.push(['HSET', `platform:rsvp:${id}`, entry.id, JSON.stringify(entry)])
    for (const wish of [...data.wishes].reverse()) commands.push(['RPUSH', `platform:guestbook:${id}`, JSON.stringify(wish)])
    for (const guest of data.guests) {
      const { opens, ...record } = guest
      commands.push(['HSET', `platform:guests:${id}`, guest.key, JSON.stringify(record)])
      if (opens) commands.push(['HSET', `platform:guest-opens:${id}`, guest.key, JSON.stringify(opens)])
    }
    await pipeline(commands)
    return
  }
  await locked(async () => {
    const bag = await readBag()
    bag.rsvp[id] = Object.fromEntries(data.rsvps.map((entry) => [entry.id, entry]))
    bag.wishes[id] = data.wishes
    bag.guests[id] = data.guests.map(({ opens: _opens, ...guest }) => guest)
    bag.opens[id] = Object.fromEntries(
      data.guests.filter((guest) => guest.opens).map((guest) => [guest.key, guest.opens as GuestOpens]),
    )
    await writeBag(bag)
  })
}
