import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/redis'
import { guestOpened } from '@/lib/platform/engagement'
import { platformJson } from '@/lib/platform/http'
import { guestMiss, invitationForGuest } from '@/lib/platform/invite-access'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const invite = await invitationForGuest(slug)
    if (!invite) return guestMiss()
    const body = (await request.json()) as { name?: unknown }
    await guestOpened(invite.id, String(body.name ?? ''), clientIp(request))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return platformJson(error, 'Không ghi được lượt mở')
  }
}
