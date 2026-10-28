const MEDIA_PATH = /^\/api\/media\/([A-Za-z0-9_-]{16})$/

type MediaSource = {
  hero?: { src?: string }
  gallery?: { src?: string }[]
  gift?: { groom?: { qrPath?: string }; bride?: { qrPath?: string } }
  music?: { playlist?: string[] }
}

export function mediaIdFromUrl(src: string) {
  const match = MEDIA_PATH.exec(src.trim())
  return match?.[1] ?? null
}

/** Ảnh tải lên nền tảng, bỏ qua link ngoài. */
export function collectMediaIds(content: MediaSource) {
  const ids = new Set<string>()
  const add = (src: string | undefined) => {
    if (!src) return
    const id = mediaIdFromUrl(src)
    if (id) ids.add(id)
  }
  add(content.hero?.src)
  for (const photo of content.gallery ?? []) add(photo.src)
  add(content.gift?.groom?.qrPath)
  add(content.gift?.bride?.qrPath)
  for (const src of content.music?.playlist ?? []) add(src)
  return [...ids]
}
