import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { StudioHome } from '@/components/studio/studio-home'
import { PlatformError } from '@/lib/platform/errors'
import { getSessionUser } from '@/lib/platform/session'
import { listOwnedInvitations, summarizeInvite } from '@/lib/platform/store'
import { isTemplateId, type TemplateId } from '@/lib/platform/templates'
import type { InvitationSummary } from '@/lib/platform/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Thiệp của tôi',
  robots: { index: false, follow: false },
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ mau?: string }> }) {
  const user = await getSessionUser()
  const mau = (await searchParams).mau
  const nextPath = mau && isTemplateId(mau) ? `/studio?mau=${mau}` : '/studio'
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(nextPath)}`)

  let invitations: InvitationSummary[] | null = null
  let message = ''
  try {
    invitations = (await listOwnedInvitations(user.id)).map(summarizeInvite)
  } catch (error) {
    message = error instanceof PlatformError ? error.message : 'Không mở được danh sách thiệp'
  }
  const suggested: TemplateId | null = isTemplateId(mau) ? mau : null
  if (!invitations) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="font-invite text-4xl">Chưa vào được xưởng thiệp</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{message}</p>
      </div>
    )
  }
  return <StudioHome user={user} invitations={invitations} suggested={suggested} />
}
