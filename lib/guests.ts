/**
 * Danh sách khách mời + theo dõi ai đã mở thiệp - lưu trên Upstash Redis
 * Phần lưu trữ phía server: lib/guest-store.ts
 */
import { adminHeaders, readJson } from './fetch-json'

export interface GuestOpens {
  first: string
  last: string
  count: number
}

export interface GuestRecord {
  key: string
  name: string
  createdAt: string
  opens?: GuestOpens
}

export async function fetchGuests(password: string): Promise<GuestRecord[]> {
  const res = await fetch('/api/guests', { headers: adminHeaders(password), cache: 'no-store' })
  const data = await readJson<{ guests?: GuestRecord[] }>(res)
  return Array.isArray(data.guests) ? data.guests : []
}

export async function addGuests(names: string[], password: string) {
  const res = await fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(password) },
    body: JSON.stringify({ names }),
  })
  return readJson<{ added: number }>(res)
}

export async function deleteGuest(key: string, password: string) {
  const res = await fetch(`/api/guests/${encodeURIComponent(key)}`, { method: 'DELETE', headers: adminHeaders(password) })
  await readJson(res)
}

export function recordGuestOpen(name: string, endpoint = '/api/guest-open') {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    keepalive: true,
  })
}
