import { describeDate, type WeddingContent } from '@/lib/content'
import type { GalleryImage } from '@/lib/gallery'
import { safeMediaUrl } from '@/lib/platform/view'

export type WeddingModel = {
  wedding: {
    groom: string
    bride: string
    groomShort: string
    brideShort: string
    groomBrand: string
    brideBrand: string
    date: string
    dateShort: string
    startISO: string
    endISO: string
    ceremony: {
      name: string
      time: string
      timeDisplay: string
      venue: string
      dayOfWeek: string
      day: string
      month: string
      year: string
      lunarYear: string
      lunarDate: string
      location: string
    }
    intimateMeal: { name: string; time: string; venue: string }
    addToCalendarUrl: string
  }
  announcement: string
  familyAddresses: {
    groomFamily: { label: string; address: string; mapsUrl: string }
    brideFamily: { label: string; address: string; mapsUrl: string }
  }
  mapEmbed: string
  loveStory: { title: string; story: string; timeline: { date: string; event: string }[] }
  family: WeddingContent['family']
  gift: WeddingContent['gift']
  hero: WeddingContent['hero']
  gallery: GalleryImage[]
  music: { playlist: string[]; volume: number }
  hasGift: boolean
  hasStory: boolean
}

function calendarStamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function safeAudio(src: string) {
  return safeMediaUrl(src)
}

export function deriveWedding(content: WeddingContent): WeddingModel {
  const start = describeDate(content.event.start)
  const end = describeDate(content.event.end)
  const groom = content.couple.groom.trim()
  const bride = content.couple.bride.trim()
  const groomShort = content.couple.groomShort.trim() || groom || 'Chú rể'
  const brideShort = content.couple.brideShort.trim() || bride || 'Cô dâu'
  const groomBrand = content.couple.groomBrand.trim() || groomShort
  const brideBrand = content.couple.brideBrand.trim() || brideShort
  const location = content.event.location.trim()
  const startISO = start?.iso ?? ''
  const endISO = end?.iso ?? ''
  const startStamp = startISO ? calendarStamp(startISO) : ''
  const endStamp = endISO ? calendarStamp(endISO) : ''
  const calendarDetails = `${content.event.ceremonyName} & ${content.event.mealName}`.trim()
  const addToCalendarUrl =
    startStamp && endStamp
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Đám cưới ${groomShort} & ${brideShort}`)}&dates=${startStamp}/${endStamp}&ctz=Asia/Ho_Chi_Minh&details=${encodeURIComponent(calendarDetails)}&location=${encodeURIComponent(location)}`
      : ''

  const lat = Number(content.event.venueLat)
  const lng = Number(content.event.venueLng)
  const mapEmbed =
    lat && lng
      ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=vi&output=embed`
      : location
        ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=15&hl=vi&output=embed`
        : ''

  const mapsUrl = safeMediaUrl(content.addresses.groomFamily.mapsUrl) || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : '')
  const brideMaps = safeMediaUrl(content.addresses.brideFamily.mapsUrl)
  const timeline = (content.story.timeline ?? [])
    .map((item) => ({ date: item.date.trim(), event: item.event.trim() }))
    .filter((item) => item.date || item.event)
  const gallery = (content.gallery ?? []).flatMap((photo) => {
    const src = safeMediaUrl(photo.src)
    if (!src) return []
    const image: GalleryImage = {
      src,
      alt: photo.alt.trim() || 'Ảnh cưới',
      caption: photo.caption?.trim() || undefined,
      focus: photo.focus?.trim() || undefined,
    }
    return [image]
  })
  const gift = content.gift
  const hasGift = [gift.groom, gift.bride].some((account) => account.accountNumber.trim() || safeMediaUrl(account.qrPath))
  const playlist = (content.music.playlist ?? []).map(safeAudio).filter(Boolean)
  const volume = Number.isFinite(content.music.volume) ? Math.min(1, Math.max(0, content.music.volume)) : 0.5

  return {
    wedding: {
      groom: groom || groomShort,
      bride: bride || brideShort,
      groomShort,
      brideShort,
      groomBrand,
      brideBrand,
      date: start?.date ?? '',
      dateShort: start?.dateShort ?? '',
      startISO,
      endISO,
      ceremony: {
        name: content.event.ceremonyName.trim() || 'Lễ thành hôn',
        time: content.event.ceremonyTime.trim(),
        timeDisplay: start?.timeDisplay ?? content.event.ceremonyTime.trim(),
        venue: content.event.ceremonyVenue.trim(),
        dayOfWeek: start?.dayOfWeek ?? '',
        day: start?.day ?? '',
        month: start ? `THÁNG ${start.month}` : '',
        year: start?.year ?? '',
        lunarYear: content.event.lunarYear.trim(),
        lunarDate: content.event.lunarDate.trim(),
        location,
      },
      intimateMeal: {
        name: content.event.mealName.trim() || 'Tiệc cưới',
        time: content.event.mealTime.trim(),
        venue: content.event.mealVenue.trim(),
      },
      addToCalendarUrl,
    },
    announcement: content.announcement.trim() || 'Trân trọng kính mời',
    familyAddresses: {
      groomFamily: { label: 'Nhà trai', address: content.addresses.groomFamily.address.trim() || location, mapsUrl },
      brideFamily: { label: 'Nhà gái', address: content.addresses.brideFamily.address.trim(), mapsUrl: brideMaps },
    },
    mapEmbed,
    loveStory: { title: content.story.title.trim(), story: content.story.text.trim(), timeline },
    family: content.family,
    gift: {
      groom: { ...gift.groom, qrPath: safeMediaUrl(gift.groom.qrPath) },
      bride: { ...gift.bride, qrPath: safeMediaUrl(gift.bride.qrPath) },
    },
    hero: { src: safeMediaUrl(content.hero.src), focus: content.hero.focus || '50% 40%' },
    gallery,
    music: { playlist, volume },
    hasGift,
    hasStory: Boolean(content.story.title.trim() || content.story.text.trim() || timeline.length),
  }
}
