const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'dang-nhap',
  'demo',
  'mau',
  'quan-ly',
  'quan-tri',
  'studio',
  'tao-thiep',
  'thiep',
  'tien-dat-huyen-trang',
  'www',
  'xem',
])

/** "Huyền Trang" → "huyen-trang" */
export function normalizeSlug(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function slugError(slug: string) {
  if (slug.length < 3) return 'Đường dẫn cần ít nhất 3 ký tự, ví dụ minh-va-lan'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang'
  if (RESERVED.has(slug)) return 'Đường dẫn này được giữ cho hệ thống'
  return null
}

export function normalizeUsername(input: string) {
  const username = input.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._]{2,31}$/.test(username)) return ''
  return username
}
