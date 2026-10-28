/**
 * Xác nhận tham dự - lưu trên Upstash Redis qua API /api/rsvp
 * Phần lưu trữ phía server: lib/rsvp-store.ts
 */
import { adminHeaders, readJson } from './fetch-json'

export const RSVP_GUEST_OPTIONS = ['1', '2', '3', '4', '5', '6+'] as const
export const RSVP_LIMITS = { name: 80, note: 500 }
export const VN_PHONE = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/

export type RsvpSide = 'groom' | 'bride'

export interface RsvpInput {
  name: string
  phone: string
  attending: boolean
  side: RsvpSide
  guests: string
  note: string
  /** Tên trong link mời (?to=...) để đối chiếu với danh sách khách */
  invite?: string
  _gotcha?: string
}

export interface RsvpEntry extends Omit<RsvpInput, '_gotcha'> {
  /** = số điện thoại: khách gửi lại thì cập nhật chứ không tạo bản ghi mới */
  id: string
  createdAt: string
  updatedAt: string
}

export function normalizePhone(phone: string) {
  return phone.replace(/[\s.\-()]/g, '')
}

/** Số người dự kiến của một phản hồi ("6+" tính là 6) */
export function headcount(entry: Pick<RsvpEntry, 'attending' | 'guests'>) {
  if (!entry.attending) return 0
  return entry.guests === '6+' ? 6 : Number(entry.guests) || 1
}

export async function postRsvp(input: RsvpInput, endpoint = '/api/rsvp') {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await readJson(res)
}

export async function fetchRsvps(password: string): Promise<RsvpEntry[]> {
  const res = await fetch('/api/rsvp', { headers: adminHeaders(password), cache: 'no-store' })
  const data = await readJson<{ entries?: RsvpEntry[] }>(res)
  return Array.isArray(data.entries) ? data.entries : []
}

export async function deleteRsvp(id: string, password: string) {
  const res = await fetch(`/api/rsvp/${encodeURIComponent(id)}`, { method: 'DELETE', headers: adminHeaders(password) })
  await readJson(res)
}
