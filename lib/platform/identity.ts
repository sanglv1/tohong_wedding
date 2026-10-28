import { normalizeUsername } from './slug'

/** Email viết thường, hoặc chuỗi rỗng nếu không dùng được. */
export function normalizeEmail(input: string) {
  const email = input.trim().toLowerCase().slice(0, 120)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ''
  return email
}

/** Phần trước @ thành tên đăng nhập nội bộ. Người dùng không cần nhập tên này. */
export function usernameSeed(source: string) {
  const cleaned = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+/, '')
    .slice(0, 20)
  const seed = cleaned.length >= 3 ? cleaned : `khach${cleaned}`
  return normalizeUsername(seed) || 'khach'
}
