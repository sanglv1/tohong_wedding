export const OPENINGS = [
  { id: 'phong-bi', name: 'Phong bì', blurb: 'Dấu sáp tách, nắp lật, hai cánh cửa mở.' },
  { id: 'rem-cua', name: 'Rèm cửa', blurb: 'Hai cánh kéo lên, thiệp hiện ra.' },
  { id: 'anh-sang', name: 'Ánh sáng', blurb: 'Thiệp tan trong một vệt sáng.' },
  { id: 'canh-hoa', name: 'Cánh hoa', blurb: 'Hoa rơi, thiệp bay lên.' },
  { id: 'trang', name: 'Mở sẵn', blurb: 'Không có bìa, vào thẳng thiệp.' },
] as const

export type OpeningId = (typeof OPENINGS)[number]['id']

export function isOpening(value: unknown): value is OpeningId {
  return typeof value === 'string' && OPENINGS.some((item) => item.id === value)
}

export function openingById(id: string) {
  return OPENINGS.find((item) => item.id === id) ?? OPENINGS[0]
}

/** Cách hiện album. Tự chọn giữ lối cũ: ảnh dọc thì xoay vòng, ảnh ngang thì trượt. */
export const ALBUMS = [
  { id: 'tu-dong', name: 'Tự chọn' },
  { id: 'truot', name: 'Trượt' },
  { id: 'vong', name: 'Vòng' },
  { id: 'luoi', name: 'Lưới' },
  { id: 'xep', name: 'Xếp' },
  { id: 'phim', name: 'Phim' },
] as const

export type AlbumId = (typeof ALBUMS)[number]['id']

export function isAlbum(value: unknown): value is AlbumId {
  return typeof value === 'string' && ALBUMS.some((item) => item.id === value)
}

export function albumById(id: string) {
  return ALBUMS.find((item) => item.id === id) ?? ALBUMS[0]
}

/** Cách mở hộp mừng. Phong bì là lối thiệp gốc. Hộp quà và thùng là một món, mở ra cả hai tài khoản. */
export const GIFTS = [
  { id: 'phong-bi', name: 'Phong bì' },
  { id: 'hop', name: 'Hộp quà' },
  { id: 'thung', name: 'Thùng quà' },
  { id: 'tui', name: 'Túi lụa' },
  { id: 'tim', name: 'Hộp tim' },
  { id: 'the', name: 'Thẻ' },
  { id: 'keo', name: 'Ruy băng' },
  { id: 'mo', name: 'Mở sẵn' },
] as const

export type GiftId = (typeof GIFTS)[number]['id']

export function isGift(value: unknown): value is GiftId {
  return typeof value === 'string' && GIFTS.some((item) => item.id === value)
}

export function giftById(id: string) {
  return GIFTS.find((item) => item.id === id) ?? GIFTS[0]
}

/** Bài có sẵn. Bài gốc là nhạc thiệp Tiến Đạt & Huyền Trang. Tám bài wav là nhạc hộp nhạc. Mười bài mp3 là kho nhạc cưới soạn riêng. */
export const TRACKS = [
  { name: 'Bài gốc', src: '/music/1.mp3' },
  { name: 'Thư', src: '/music/thu.wav' },
  { name: 'Vườn', src: '/music/vuon.wav' },
  { name: 'Sen', src: '/music/sen.wav' },
  { name: 'Lá', src: '/music/la.wav' },
  { name: 'Đất', src: '/music/dat.wav' },
  { name: 'Đêm', src: '/music/dem.wav' },
  { name: 'Sáng', src: '/music/sang.wav' },
  { name: 'Biển', src: '/music/bien.wav' },
  { name: 'Đàn tranh', src: '/music/dan.mp3' },
  { name: 'Sao', src: '/music/sao.mp3' },
  { name: 'Valse', src: '/music/van.mp3' },
  { name: 'Phố cũ', src: '/music/pho.mp3' },
  { name: 'Cung đình', src: '/music/cung.mp3' },
  { name: 'Sóng', src: '/music/song.mp3' },
  { name: 'Đèn hội', src: '/music/hoi.mp3' },
  { name: 'Mai vàng', src: '/music/mai.mp3' },
  { name: 'Nhật ký', src: '/music/ky.mp3' },
  { name: 'Nhịp', src: '/music/nhip.mp3' },
] as const

export function trackBySrc(src: string) {
  return TRACKS.find((track) => track.src === src)
}
