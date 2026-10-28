/**
 * Thiệp gốc Tiến Đạt & Huyền Trang.
 * Mọi thiệp khác dùng deriveWedding(content) với cùng kiểu dữ liệu.
 */
import { CONTENT } from './content'
import { deriveWedding } from './wedding-model'

export const CLASSIC_MODEL = deriveWedding(CONTENT)

if (!CLASSIC_MODEL.wedding.startISO || !CLASSIC_MODEL.wedding.endISO) {
  throw new Error('content/wedding.json: event.start/event.end phải có dạng YYYY-MM-DDTHH:mm')
}

export const HERO_IMAGE = CLASSIC_MODEL.hero
export const ANNOUNCEMENT = CLASSIC_MODEL.announcement
export const FAMILY_ADDRESSES = CLASSIC_MODEL.familyAddresses
export const VENUE_COORDINATES = {
  lat: CONTENT.event.venueLat,
  lng: CONTENT.event.venueLng,
}
export const WEDDING = CLASSIC_MODEL.wedding
export const LOVE_STORY = CLASSIC_MODEL.loveStory
