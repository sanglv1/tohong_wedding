import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { WeddingSite } from '@/components/wedding-site'
import { PlatformError } from '@/lib/platform/errors'
import { readPreview } from '@/lib/platform/preview'
import { getSessionUser } from '@/lib/platform/session'
import { getOwnedInvitation, isInvitationId } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Xem trước thiệp',
  robots: { index: false, follow: false },
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nhap?: string }>
}) {
  const { id } = await params
  const live = (await searchParams).nhap === '1'
  if (!isInvitationId(id)) notFound()
  const user = await getSessionUser()
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(`/xem/${id}`)}`)
  let invitation = null
  try {
    invitation = await getOwnedInvitation(user.id, id)
  } catch (error) {
    const message = error instanceof PlatformError ? error.message : 'Không mở được bản xem trước'
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-4xl">Chưa xem được</h1>
        <p className="mt-3 text-sm">{message}</p>
      </div>
    )
  }
  if (!invitation) notFound()
  const preview = live ? await readPreview(id, user.id) : null
  const content = preview?.content ?? invitation.content
  const templateId = preview?.templateId ?? invitation.templateId
  return (
    <>
      <p className="bg-stone-900 px-4 py-2 text-center text-xs leading-5 text-white">
        Bản bạn đang sửa. Khách vẫn xem bản đã xuất bản cho đến khi bạn bấm Cập nhật.
      </p>
      <WeddingSite
      content={content}
      templateId={templateId}
      guestbook
      trackOpens={false}
      endpoints={{
        rsvp: `/api/thiep/${invitation.slug}/xac-nhan`,
        guestbook: `/api/thiep/${invitation.slug}/so`,
        guestOpen: `/api/thiep/${invitation.slug}/mo`,
      }}
      platformLink
    />
    </>
  )
}
