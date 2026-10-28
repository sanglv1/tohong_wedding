const MAX_GUEST_NAME_LENGTH = 60

/** Tên khách mời từ link dạng ?to=Anh%20Minh - dùng để cá nhân hóa thiệp */
export function readGuestName(search: string): string | null {
  const raw = new URLSearchParams(search).get('to')
  if (!raw) return null
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_GUEST_NAME_LENGTH)
  return name || null
}

/** Khoá so khớp một khách mời: "Chị  Lan" và "chị lan" là cùng một người */
export function guestKey(name: string) {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, MAX_GUEST_NAME_LENGTH).toLocaleLowerCase('vi')
}

/** Link "Mở thử" của người quản lý có thêm tham số này để không tính là khách đã mở */
export const PREVIEW_PARAM = 'xem-thu'

export function guestLink(origin: string, name: string, preview = false, path = '/thiep/tien-dat-huyen-trang') {
  const params = new URLSearchParams({ to: name })
  if (preview) params.set(PREVIEW_PARAM, '1')
  return `${origin}${path}?${params}`
}
