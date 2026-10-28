import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WeddingSite } from '@/components/wedding-site'
import { CONTENT } from '@/lib/content'
import { isGuestbookConfigured } from '@/lib/guestbook-store'
import { PlatformError } from '@/lib/platform/errors'
import { isArchived } from '@/lib/platform/commerce'
import { publicContent, publicTemplate, publishedIsBehind } from '@/lib/platform/save-plan'
import { getSessionUser } from '@/lib/platform/session'
import { getInvitationBySlug } from '@/lib/platform/store'
import { CLASSIC_SLUG } from '@/lib/platform/templates'
import { safeMediaUrl } from '@/lib/platform/view'
import { deriveWedding } from '@/lib/wedding-model'
import type { InvitationRecord } from '@/lib/platform/types'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

const hiddenMeta = {
  title: 'Không thấy thiệp',
  robots: { index: false, follow: false },
}

function shareImage(src: string) {
  const safe = safeMediaUrl(src)
  if (!safe) return undefined
  if (safe.startsWith('https://') || safe.startsWith('http://')) return safe
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!site || !safe.startsWith('/')) return undefined
  return `${site}${safe}`
}

function classicMeta(): Metadata {
  const model = deriveWedding(CONTENT)
  const title = `Thiệp cưới ${model.wedding.groomShort} & ${model.wedding.brideShort}`
  const description = `${model.announcement} ${model.wedding.date}`.trim()
  return { title, description, openGraph: { title, description } }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  if (slug === CLASSIC_SLUG) return classicMeta()
  try {
    const invite = await getInvitationBySlug(slug)
    if (!invite?.published) return hiddenMeta
    const content = publicContent(invite)
    const groom = content.couple.groomShort || content.couple.groom || 'Chú rể'
    const bride = content.couple.brideShort || content.couple.bride || 'Cô dâu'
    const title = `Thiệp cưới ${groom} & ${bride}`
    const description = content.announcement.trim() || title
    const image = shareImage(content.hero.src)
    return {
      title,
      description,
      openGraph: { title, description, images: image ? [image] : undefined },
    }
  } catch {
    return { title: 'Thiệp tạm thời không mở được', robots: { index: false, follow: false } }
  }
}

function endpoints(slug: string) {
  return {
    rsvp: `/api/thiep/${slug}/xac-nhan`,
    guestbook: `/api/thiep/${slug}/so`,
    guestOpen: `/api/thiep/${slug}/mo`,
  }
}

export default async function InvitationPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  if (slug === CLASSIC_SLUG) {
    return (
      <WeddingSite
        content={CONTENT}
        templateId="trang-dat"
        guestbook={isGuestbookConfigured && !isArchived(CONTENT.event.end)}
        trackOpens={isGuestbookConfigured}
        archived={isArchived(CONTENT.event.end)}
      />
    )
  }

  let invite: InvitationRecord | null = null
  try {
    invite = await getInvitationBySlug(slug)
  } catch (error) {
    const message = error instanceof PlatformError ? error.message : 'Thiệp tạm thời không mở được'
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-invite text-4xl">Chưa mở được thiệp</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p>
      </div>
    )
  }
  if (!invite) notFound()

  let user: { id: string } | null = null
  try {
    user = await getSessionUser()
  } catch {
    user = null
  }
  const isOwner = user?.id === invite.ownerId
  if (!invite.published && !isOwner) notFound()

  const content = invite.published ? publicContent(invite) : invite.content
  const templateId = invite.published ? publicTemplate(invite) : invite.templateId
  const behind = publishedIsBehind(invite)

  return (
    <>
      {isOwner && (
        <div className="sticky top-0 z-[80] flex items-center justify-between gap-3 bg-stone-900 px-4 py-2 text-sm text-white">
          <p>
            {!invite.published && 'Bản nháp — khách chưa xem được link này.'}
            {invite.published && behind && 'Khách đang xem bản đã xuất bản. Phần mới chỉ hiện sau khi bạn bấm Cập nhật.'}
            {invite.published && !behind && 'Khách có thể mở thiệp này.'}
          </p>
          <a href={`/studio/${invite.id}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-3 text-stone-900">
            Sửa thiệp
          </a>
        </div>
      )}
      <WeddingSite
        content={content}
        templateId={templateId}
        guestbook={!isArchived(content.event.end)}
        trackOpens
        endpoints={endpoints(slug)}
        platformLink
        archived={isArchived(content.event.end)}
      />
    </>
  )
}
