import { describeDate, type WeddingContent } from '@/lib/content'

export type InvitePhoto = { src: string; alt: string; caption: string; focus: string }

export type InviteGift = {
  label: string
  bank: string
  number: string
  holder: string
  qr: string
}

export type InviteEvent = { name: string; time: string; venue: string }

export type InviteView = {
  names: { groom: string; bride: string; groomFull: string; brideFull: string }
  monogram: string
  date: {
    day: string
    month: string
    year: string
    weekday: string
    time: string
    full: string
  } | null
  lunar: string
  announcement: string
  ceremony: InviteEvent
  meal: InviteEvent
  location: string
  brideHome: string
  map: string
  calendar: string
  storyTitle: string
  story: string
  timeline: { date: string; event: string }[]
  photos: InvitePhoto[]
  gifts: InviteGift[]
  parents: { label: string; people: { role: string; name: string }[] }[]
}

const WEEKDAY: Record<string, string> = {
  'CHỦ NHẬT': 'Chủ Nhật',
  'THỨ HAI': 'Thứ Hai',
  'THỨ BA': 'Thứ Ba',
  'THỨ TƯ': 'Thứ Tư',
  'THỨ NĂM': 'Thứ Năm',
  'THỨ SÁU': 'Thứ Sáu',
  'THỨ BẢY': 'Thứ Bảy',
}

export function safeHttp(src: string) {
  const value = src.trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
  } catch {
    return ''
  }
  return ''
}

/** Ảnh: link http(s) hoặc đường dẫn nội bộ bắt đầu bằng / */
export function safeMediaUrl(src: string) {
  const value = src.trim()
  if (!value) return ''
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !value.includes('..')) return value
  return safeHttp(value)
}

function eventOf(name: string, time: string, venue: string): InviteEvent {
  return { name: name.trim(), time: time.trim(), venue: venue.trim() }
}

function house(label: string, side: { ong?: string; ba?: string } | undefined) {
  const people = [
    { role: 'Ông', name: side?.ong?.trim() ?? '' },
    { role: 'Bà', name: side?.ba?.trim() ?? '' },
  ].filter((person) => person.name)
  if (!people.length) return null
  return { label, people }
}

function initial(name: string) {
  const word = name.trim().split(/\s+/).at(-1) ?? name
  return word.charAt(0).toLocaleUpperCase('vi')
}

function giftOf(account: WeddingContent['gift']['groom'], fallback: string): InviteGift | null {
  const number = account.accountNumber.trim()
  const qr = safeMediaUrl(account.qrPath)
  if (!number && !qr) return null
  return {
    label: account.name.trim() || fallback,
    bank: account.bankName.trim(),
    number,
    holder: account.accountName.trim(),
    qr,
  }
}

function calendarUrl(content: WeddingContent) {
  const start = describeDate(content.event.start)
  const end = describeDate(content.event.end)
  if (!start || !end) return ''
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const groom = content.couple.groom.trim() || content.couple.groomShort.trim() || 'chú rể'
  const bride = content.couple.bride.trim() || content.couple.brideShort.trim() || 'cô dâu'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Lễ cưới ${groom} & ${bride}`,
    dates: `${stamp(start.iso)}/${stamp(end.iso)}`,
    details: content.announcement.trim(),
    location: content.event.location.trim(),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function present(content: WeddingContent): InviteView {
  const start = describeDate(content.event.start)
  const groomRaw = content.couple.groomShort.trim() || content.couple.groom.trim()
  const brideRaw = content.couple.brideShort.trim() || content.couple.bride.trim()
  const photos: InvitePhoto[] = []
  const seen = new Set<string>()
  const addPhoto = (src: string, alt: string, caption: string, focus: string) => {
    const safe = safeMediaUrl(src)
    if (!safe || seen.has(safe)) return
    seen.add(safe)
    photos.push({
      src: safe,
      alt: alt.trim() || 'Ảnh cưới',
      caption: caption.trim(),
      focus: /^\d{1,3}%\s+\d{1,3}%$/.test(focus.trim()) ? focus.trim() : '',
    })
  }
  addPhoto(content.hero.src, 'Ảnh của hai chúng tôi', '', content.hero.focus ?? '')
  for (const photo of content.gallery ?? []) addPhoto(photo.src, photo.alt, photo.caption ?? '', photo.focus ?? '')

  const brideHome = content.addresses.brideFamily.address.trim()
  const location = content.event.location.trim()
  const gifts = [giftOf(content.gift.groom, 'Chú rể'), giftOf(content.gift.bride, 'Cô dâu')].filter(
    (item): item is InviteGift => item !== null,
  )
  const parents = [house('Nhà trai', content.family.nhaTrai), house('Nhà gái', content.family.nhaGai)].filter(
    (group): group is InviteView['parents'][number] => group !== null,
  )

  const directMap = safeHttp(content.addresses.groomFamily.mapsUrl)
  const map = directMap || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : '')

  return {
    names: {
      groom: groomRaw || 'Chú rể',
      bride: brideRaw || 'Cô dâu',
      groomFull: content.couple.groom.trim() || groomRaw || 'Chú rể',
      brideFull: content.couple.bride.trim() || brideRaw || 'Cô dâu',
    },
    monogram: groomRaw && brideRaw ? `${initial(groomRaw)}${initial(brideRaw)}` : '&',
    date: start
      ? {
          day: start.day,
          month: start.month,
          year: start.year,
          weekday: WEEKDAY[start.dayOfWeek] ?? start.dayOfWeek,
          time: start.timeDisplay,
          full: start.date,
        }
      : null,
    lunar: content.event.lunarDate.trim(),
    announcement: content.announcement.trim() || 'Trân trọng kính mời',
    ceremony: eventOf(content.event.ceremonyName, content.event.ceremonyTime, content.event.ceremonyVenue),
    meal: eventOf(content.event.mealName, content.event.mealTime, content.event.mealVenue),
    location,
    brideHome: brideHome && brideHome !== location ? brideHome : '',
    map,
    calendar: calendarUrl(content),
    storyTitle: content.story.title.trim(),
    story: content.story.text.trim(),
    timeline: (content.story.timeline ?? [])
      .map((item) => ({ date: item.date.trim(), event: item.event.trim() }))
      .filter((item) => item.date || item.event)
      .slice(0, 8),
    photos,
    gifts,
    parents,
  }
}
