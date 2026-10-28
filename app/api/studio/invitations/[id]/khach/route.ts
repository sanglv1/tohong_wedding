import { NextResponse } from 'next/server'
import { guestAdd, guestList, guestRemove, rsvpList, rsvpRemove, wishList, wishRemove } from '@/lib/platform/engagement'
import { platformJson } from '@/lib/platform/http'
import { invitationForOwner } from '@/lib/platform/invite-access'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params
    const invite = await invitationForOwner(id)
    const [rsvps, wishes, guests] = await Promise.all([rsvpList(invite.id), wishList(invite.id), guestList(invite.id)])
    return NextResponse.json({ rsvps, wishes, guests })
  } catch (error) {
    return platformJson(error, 'Không tải được khách')
  }
}

export async function POST(request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params
    const invite = await invitationForOwner(id)
    const body = (await request.json()) as { action?: string; names?: unknown; key?: string; entryId?: string }
    if (body.action === 'add-guests') {
      if (!Array.isArray(body.names)) return NextResponse.json({ error: 'Thiếu danh sách tên' }, { status: 400 })
      return NextResponse.json({ added: await guestAdd(invite.id, body.names) })
    }
    if (body.action === 'delete-guest') return NextResponse.json({ ok: await guestRemove(invite.id, String(body.key ?? '')) })
    if (body.action === 'delete-rsvp') return NextResponse.json({ ok: await rsvpRemove(invite.id, String(body.entryId ?? '')) })
    if (body.action === 'delete-wish') return NextResponse.json({ ok: await wishRemove(invite.id, String(body.entryId ?? '')) })
    return NextResponse.json({ error: 'Không rõ yêu cầu' }, { status: 400 })
  } catch (error) {
    return platformJson(error, 'Không lưu được')
  }
}
