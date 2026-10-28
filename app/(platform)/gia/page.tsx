import type { Metadata } from 'next'
import { SiteChrome } from '@/components/platform/site-chrome'
import { Pricing } from '@/components/studio/pricing'
import { getSessionUser } from '@/lib/platform/session'
import { listOwnedInvitations } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Giá thiệp',
  description: 'Viết thiệp miễn phí trên Tơ Hồng. Trả một lần khi xuất bản link cho khách.',
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ thiep?: string }> }) {
  const selected = (await searchParams).thiep ?? ''
  const user = await getSessionUser().catch(() => null)
  const invitations = user
    ? (await listOwnedInvitations(user.id).catch(() => [])).map((invite) => ({
        id: invite.id,
        label: [invite.content.couple?.groom, invite.content.couple?.bride].filter(Boolean).join(' & ') || invite.slug,
      }))
    : []
  return (
    <SiteChrome>
      <Pricing signedIn={Boolean(user)} invitations={invitations} selected={selected} />
    </SiteChrome>
  )
}
