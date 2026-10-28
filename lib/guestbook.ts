/**
 * Sổ lưu bút - lời chúc lưu trên Upstash Redis qua API /api/guestbook
 * Phần lưu trữ phía server: lib/guestbook-store.ts
 */
import { adminHeaders, readJson } from './fetch-json'

export const GUESTBOOK_LIMITS = { name: 60, message: 500 }

export interface GuestbookEntry {
  id?: string
  name: string
  message: string
  createdAt: string
}

export async function fetchGuestbook(endpoint = '/api/guestbook'): Promise<GuestbookEntry[]> {
  const res = await fetch(endpoint, { cache: 'no-store' })
  const data = await readJson<{ entries?: GuestbookEntry[] }>(res)
  return Array.isArray(data.entries) ? data.entries : []
}

export async function postGuestbook(entry: { name: string; message: string; website?: string }, endpoint = '/api/guestbook') {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  const data = await readJson<{ entry?: GuestbookEntry }>(res)
  return data.entry
}

export async function deleteGuestbookEntry(id: string, password: string) {
  const res = await fetch(`/api/guestbook/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(password),
  })
  await readJson(res)
}

export async function verifyGuestbookPassword(password: string) {
  const res = await fetch('/api/guestbook/auth', { method: 'POST', headers: adminHeaders(password) })
  await readJson(res)
}
