/**
 * Các theme màu nền cho trang cưới (bảng màu khai báo trong app/globals.css)
 * Thổ (Earth), Mộc (Wood) - Ngũ hành
 */
export const THEMES = {
  red: { name: 'Hồng đào' },
  green: { name: 'Xanh xô thơm' },
  pink: { name: 'Hồng phấn' },
  white: { name: 'Trắng ngà' },
  tho: { name: 'Mệnh Thổ' },
  moc: { name: 'Mệnh Mộc' },
  bordeaux: { name: 'Đỏ rượu vang' },
  dem: { name: 'Đêm vàng' },
  bien: { name: 'Biển cát' },
  han: { name: 'Nét Hàn' },
  kinh: { name: 'Kính mờ' },
  vang: { name: 'Son vàng' },
  nga: { name: 'Nhà thờ' },
  oliu: { name: 'Lá oliu' },
  suong: { name: 'Sương sớm' },
  man: { name: 'Mận chín' },
  dao: { name: 'Đào tiên' },
  son: { name: 'Son hỷ' },
  muc: { name: 'Mực tàu' },
  sao: { name: 'Đêm sao' },
  nhung: { name: 'Nhung đỏ' },
  gach: { name: 'Gạch bông' },
  lac: { name: 'Cung đình' },
  song: { name: 'Sóng nhẹ' },
  long: { name: 'Đèn lồng' },
  bao: { name: 'Báo xuân' },
  so: { name: 'Sổ tay' },
  betong: { name: 'Kính mảnh' },
  lua: { name: 'Lụa sáng' },
} as const

export type ThemeId = keyof typeof THEMES

export const DEFAULT_THEME: ThemeId = 'bordeaux'
export const THEME_STORAGE_KEY = 'wedding-theme'
export const THEME_ORDER = Object.keys(THEMES) as ThemeId[]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES
}

/** Chạy trước khi trang hiển thị để không bị nháy theme mặc định */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t&&${JSON.stringify(
  THEME_ORDER,
)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`
