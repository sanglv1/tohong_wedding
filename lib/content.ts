import raw from '@/content/wedding.json'
import type { OpeningId } from '@/lib/platform/experience'

/**
 * Nội dung thiệp cưới - lưu trong content/wedding.json, sửa qua trang /admin (chỉ khi chạy npm run dev)
 */
export interface WeddingContent {
  couple: {
    groom: string
    bride: string
    groomShort: string
    brideShort: string
    groomBrand: string
    brideBrand: string
  }
  event: {
    /** Giờ Việt Nam, dạng 'YYYY-MM-DDTHH:mm' */
    start: string
    end: string
    lunarDate: string
    lunarYear: string
    ceremonyName: string
    ceremonyTime: string
    ceremonyVenue: string
    location: string
    mealName: string
    mealTime: string
    mealVenue: string
    venueLat: number
    venueLng: number
  }
  addresses: {
    groomFamily: { address: string; mapsUrl: string }
    brideFamily: { address: string; mapsUrl: string }
  }
  family: {
    nhaTrai: { ong: string; ba: string }
    nhaGai: { ong: string; ba: string }
  }
  announcement: string
  story: {
    title: string
    text: string
    timeline: { date: string; event: string }[]
  }
  hero: { src: string; focus: string }
  /** focus: vị trí giữ lại khi ảnh bị cắt cho vừa khung, ví dụ "50% 80%" (ngang, dọc) */
  gallery: { src: string; alt: string; caption: string; focus?: string }[]
  gift: Record<'groom' | 'bride', GiftAccount>
  music: { playlist: string[]; volume: number }
  /** Cách bìa thiệp mở. Thiếu thì dùng hiệu ứng mặc định của mẫu. */
  opening?: OpeningId
}

export interface GiftAccount {
  qrPath: string
  name: string
  bankName: string
  accountNumber: string
  accountName: string
}

export const CONTENT: WeddingContent = raw

const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const WEEKDAYS = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY']

function partOfDay(hour: number) {
  if (hour < 11) return 'Sáng'
  if (hour < 13) return 'Trưa'
  if (hour < 18) return 'Chiều'
  return 'Tối'
}

/** Tách ngày giờ Việt Nam thành các phần hiển thị trên thiệp */
export function describeDate(local: string) {
  const m = LOCAL_DATETIME.exec(local)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  const weekday = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay()
  return {
    iso: `${local}:00+07:00`,
    day: String(+d),
    month: String(+mo),
    year: y,
    dayOfWeek: WEEKDAYS[weekday],
    date: `${+d} tháng ${+mo}, ${y}`,
    dateShort: `${d}/${mo}/${y}`,
    timeDisplay: `${h}:${mi} ${partOfDay(+h)}`,
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function allStrings(v: unknown, keys: string[]) {
  return isObject(v) && keys.every((k) => typeof v[k] === 'string')
}

/** Kiểm tra dữ liệu trước khi ghi file - trả về thông báo lỗi hoặc null nếu hợp lệ */
export function validateContent(v: unknown): string | null {
  if (!isObject(v)) return 'Dữ liệu không hợp lệ'
  if (!allStrings(v.couple, ['groom', 'bride', 'groomShort', 'brideShort', 'groomBrand', 'brideBrand']))
    return 'Thiếu tên cô dâu/chú rể'
  const e = v.event
  if (!isObject(e) || typeof e.start !== 'string' || !describeDate(e.start)) return 'Giờ bắt đầu không hợp lệ'
  if (typeof e.end !== 'string' || !describeDate(e.end)) return 'Giờ kết thúc không hợp lệ'
  if (e.end <= e.start) return 'Giờ kết thúc phải sau giờ bắt đầu'
  if (typeof e.venueLat !== 'number' || typeof e.venueLng !== 'number') return 'Toạ độ bản đồ phải là số'
  if (!isObject(v.addresses) || !allStrings(v.addresses.groomFamily, ['address', 'mapsUrl']) || !allStrings(v.addresses.brideFamily, ['address', 'mapsUrl']))
    return 'Thiếu địa chỉ nhà trai/nhà gái'
  if (!isObject(v.family) || !allStrings(v.family.nhaTrai, ['ong', 'ba']) || !allStrings(v.family.nhaGai, ['ong', 'ba']))
    return 'Thiếu tên bố mẹ'
  if (typeof v.announcement !== 'string') return 'Thiếu lời báo tin'
  if (!allStrings(v.story, ['title', 'text']) || !Array.isArray((v.story as Record<string, unknown>).timeline))
    return 'Câu chuyện không hợp lệ'
  if (!allStrings(v.hero, ['src', 'focus'])) return 'Ảnh bìa không hợp lệ'
  if (
    !Array.isArray(v.gallery) ||
    !v.gallery.every(
      (g) => isObject(g) && allStrings(g, ['src', 'alt', 'caption']) && (g.focus === undefined || typeof g.focus === 'string'),
    )
  )
    return 'Album ảnh không hợp lệ'
  const giftKeys = ['qrPath', 'name', 'bankName', 'accountNumber', 'accountName']
  if (!isObject(v.gift) || !allStrings(v.gift.groom, giftKeys) || !allStrings(v.gift.bride, giftKeys))
    return 'Thông tin mừng cưới không hợp lệ'
  if (!isObject(v.music) || !Array.isArray(v.music.playlist) || typeof v.music.volume !== 'number')
    return 'Nhạc nền không hợp lệ'
  return null
}
