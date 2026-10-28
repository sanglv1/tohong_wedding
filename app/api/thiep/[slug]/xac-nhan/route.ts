import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/redis'
import { submitRsvp } from '@/lib/platform/engagement'
import { isArchived } from '@/lib/platform/commerce'
import { platformJson } from '@/lib/platform/http'
import { guestMiss, invitationForGuest } from '@/lib/platform/invite-access'
import { notifyRsvp } from '@/lib/platform/notify'
import { publicContent } from '@/lib/platform/save-plan'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

export async function POST(request: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params
    const invite = await invitationForGuest(slug)
    if (!invite) return guestMiss()
    if (isArchived(publicContent(invite).event.end)) {
      return NextResponse.json({ error: 'Thiệp đã khép 45 ngày sau lễ, không nhận thêm xác nhận.' }, { status: 410 })
    }
    const body = (await request.json()) as Record<string, unknown>
    if (body._gotcha) return NextResponse.json({ ok: true })
    const entry = await submitRsvp(invite.id, body, clientIp(request))
    await notifyRsvp(invite, entry.name)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return platformJson(error, 'Không thể lưu xác nhận')
  }
}
