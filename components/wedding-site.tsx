import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CardSpotlight } from '@/components/card-spotlight'
import { CeremonyAnnouncementSection } from '@/components/ceremony-announcement-section'
import { FamilySection } from '@/components/family-section'
import { FloatingActions } from '@/components/floating-actions'
import { GallerySection } from '@/components/gallery-section'
import { GiftSection } from '@/components/gift-section'
import { GuestOpenTracker } from '@/components/guest-open-tracker'
import { GuestbookSection } from '@/components/guestbook-section'
import { HeroSection } from '@/components/hero-section'
import { InvitationCover } from '@/components/invitation-cover'
import { PetalLayer } from '@/components/petal-layer'
import { RSVPForm } from '@/components/rsvp-form'
import { ScheduleSection } from '@/components/schedule-section'
import { StorySection } from '@/components/story-section'
import { WeddingFooter } from '@/components/wedding-footer'
import { WeddingHeader } from '@/components/wedding-header'
import type { WeddingContent } from '@/lib/content'
import type { GalleryImage } from '@/lib/gallery'
import { getPublicImageSize } from '@/lib/image-size'
import { isOptimizableImage } from '@/lib/media-src'
import { isSignatureLayout } from '@/components/signature-heroes'
import { isOpening } from '@/lib/platform/experience'
import { templateById } from '@/lib/platform/templates'
import { deriveWedding } from '@/lib/wedding-model'

function withRatios(images: GalleryImage[]) {
  return images.flatMap((image) => {
    if (!isOptimizableImage(image.src)) return [image]
    if (!existsSync(join(process.cwd(), 'public', image.src))) return []
    const size = getPublicImageSize(image.src)
    return [{ ...image, ratio: size ? size.width / size.height : undefined }]
  })
}

export function WeddingSite({
  content,
  templateId,
  guestbook,
  trackOpens,
  endpoints,
  demo = false,
  platformLink = false,
  archived = false,
}: {
  content: WeddingContent
  templateId: string
  guestbook: boolean
  trackOpens: boolean
  endpoints?: { rsvp: string; guestbook: string; guestOpen: string }
  demo?: boolean
  platformLink?: boolean
  archived?: boolean
}) {
  const model = deriveWedding(content)
  const shell = templateById(templateId)
  const opening = isOpening(content.opening) ? content.opening : shell.opening
  const gallery = withRatios(model.gallery)
  const rsvp = endpoints?.rsvp ?? '/api/rsvp'
  const book = endpoints?.guestbook ?? '/api/guestbook'
  const opened = endpoints?.guestOpen ?? '/api/guest-open'
  const names = model.wedding
  const dress = isSignatureLayout(shell.layout) ? shell.layout : undefined

  return (
    <>
      {!shell.themeSwitcher && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.theme=${JSON.stringify(shell.theme)};document.documentElement.dataset.layout=${JSON.stringify(shell.layout)}`,
          }}
        />
      )}
      {(opening !== 'trang' || dress === 'broadsheet') && (
        <InvitationCover
          model={model}
          allowThemeCycle={shell.themeSwitcher}
          effect={opening === 'trang' ? 'anh-sang' : opening}
          templateId={shell.id}
          layout={shell.layout === 'veil' ? 'veil' : dress}
        />
      )}
      {trackOpens && !demo && <GuestOpenTracker endpoint={opened} />}
      <div className="paper-grain" aria-hidden />
      {shell.petals && <PetalLayer tone={shell.layout === 'veil' ? 'silk' : 'rose'} />}
      <CardSpotlight />
      <WeddingHeader
        showGuestbook={guestbook || demo}
        groomBrand={names.groomBrand}
        brideBrand={names.brideBrand}
        groomShort={names.groomShort}
        brideShort={names.brideShort}
      />
      <main data-dress={dress} className={`relative z-[1] min-h-screen overflow-x-hidden ${demo ? 'pt-[var(--demo-bar)]' : ''}`}>
        <HeroSection model={model} layout={shell.layout} />
        <StorySection model={model} dress={dress} layout={shell.layout} />
        <FamilySection model={model} />
        <CeremonyAnnouncementSection model={model} />
        <ScheduleSection model={model} />
        {gallery.length > 0 && (
          <GallerySection
            images={gallery}
            mode={shell.album}
            brand={{ groom: names.groomBrand, bride: names.brideBrand, date: names.dateShort }}
          />
        )}
        {archived ? (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
            <h2 className="font-invite text-4xl">Thiệp đã khép</h2>
            <p className="mt-3 text-sm leading-7 text-w-soft">Đã qua 45 ngày sau lễ. Khách vẫn đọc được thiệp, và không gửi thêm xác nhận hay lời chúc.</p>
          </section>
        ) : (
          <>
            <RSVPForm endpoint={rsvp} demo={demo} />
            <GuestbookSection enabled={guestbook || demo} endpoint={book} demo={demo} />
          </>
        )}
        <GiftSection model={model} style={shell.gift} />
      </main>
      <WeddingFooter platformLink={platformLink} />
      <FloatingActions music={model.music} allowThemeCycle={shell.themeSwitcher} />
    </>
  )
}
