import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StudioApp } from '@/components/studio/studio-app'
import { PlatformError } from '@/lib/platform/errors'
import { getSessionUser } from '@/lib/platform/session'
import { getOwnedInvitation, isInvitationId } from '@/lib/platform/store'
import type { InvitationRecord } from '@/lib/platform/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Thiết kế thiệp',
  robots: { index: false, follow: false },
}

export default async function StudioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const { id } = await params
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(`/studio/${id}`)}`)

  if (!isInvitationId(id)) {
    return <Missing />
  }

  let invitation: InvitationRecord | null = null
  let message = ''
  try {
    invitation = await getOwnedInvitation(user.id, id)
  } catch (error) {
    message = error instanceof PlatformError ? error.message : 'Không mở được thiệp'
  }
  if (message) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="font-invite text-4xl">Chưa mở được thiệp</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{message}</p>
        <Link href="/studio" className="mt-6 inline-block text-sm underline">
          Về danh sách thiệp
        </Link>
      </div>
    )
  }
  if (!invitation) return <Missing />
  return <StudioApp key={invitation.id} user={user} invitation={invitation} />
}

function Missing() {
  return (
    <div className="mx-auto max-w-md px-5 py-24">
      <h1 className="font-invite text-4xl">Không thấy thiệp này</h1>
      <p className="mt-4 text-sm leading-6 text-stone-600">Thiệp không còn, hoặc không thuộc tài khoản đang đăng nhập.</p>
      <Link href="/studio" className="mt-6 inline-block text-sm underline">
        Về danh sách thiệp
      </Link>
    </div>
  )
}
