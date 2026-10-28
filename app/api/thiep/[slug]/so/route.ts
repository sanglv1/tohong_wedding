import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/redis'
import { wishAdd, wishList } from '@/lib/platform/engagement'
import { isArchived } from '@/lib/platform/commerce'
import { platformJson } from '@/lib/platform/http'
import { guestMiss, invitationForGuest } from '@/lib/platform/invite-access'
import { publicContent } from '@/lib/platform/save-plan'

export const dynamic = 'force-dynamic'

type Params = { slug: string }

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params
    const invite = await invitationForGuest(slug)
    if (!invite) return guestMiss()
    return NextResponse.json({ entries: await wishList(invite.id) })
  } catch (error) {
    return platformJson(error, 'Không tải được lời chúc')
  }
}

export async function POST(request: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params
    const invite = await invitationForGuest(slug)
    if (!invite) return guestMiss()
    if (isArchived(publicContent(invite).event.end)) {
      return NextResponse.json({ error: 'Thiệp đã khép 45 ngày sau lễ, không nhận thêm lời chúc.' }, { status: 410 })
    }
    const body = (await request.json()) as Record<string, unknown>
    if (body.website) return NextResponse.json({ ok: true })
    const entry = await wishAdd(invite.id, String(body.name ?? ''), String(body.message ?? ''), clientIp(request))
    return NextResponse.json({ entry })
  } catch (error) {
    return platformJson(error, 'Không gửi được lời chúc')
  }
}
