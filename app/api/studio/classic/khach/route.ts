import { NextResponse } from 'next/server'
import { addGuests, deleteGuest, listGuests } from '@/lib/guest-store'
import { deleteEntry, listEntries } from '@/lib/guestbook-store'
import { platformJson } from '@/lib/platform/http'
import { getSessionUser } from '@/lib/platform/session'
import { isRedisConfigured } from '@/lib/redis'
import { deleteRsvp, listRsvps } from '@/lib/rsvp-store'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Chỉ quản trị xem được thiệp gốc' }, { status: 403 })
  if (!isRedisConfigured) {
    return NextResponse.json(
      { error: 'Thiệp gốc lưu khách trên Redis. Hãy điền KV_REST_API_URL và KV_REST_API_TOKEN vào .env.local rồi chạy lại.' },
      { status: 503 },
    )
  }
  return null
}

export async function GET() {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    const [rsvps, wishes, guests] = await Promise.all([listRsvps(), listEntries(), listGuests()])
    return NextResponse.json({ rsvps, wishes, guests })
  } catch (error) {
    return platformJson(error, 'Không tải được khách của thiệp gốc')
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    const body = (await request.json()) as { action?: string; names?: unknown; key?: string; entryId?: string }
    if (body.action === 'add-guests') {
      if (!Array.isArray(body.names)) return NextResponse.json({ error: 'Thiếu danh sách tên' }, { status: 400 })
      return NextResponse.json({ added: await addGuests(body.names) })
    }
    if (body.action === 'delete-guest') return NextResponse.json({ ok: await deleteGuest(String(body.key ?? '')) })
    if (body.action === 'delete-rsvp') return NextResponse.json({ ok: await deleteRsvp(String(body.entryId ?? '')) })
    if (body.action === 'delete-wish') return NextResponse.json({ ok: await deleteEntry(String(body.entryId ?? '')) })
    return NextResponse.json({ error: 'Không rõ yêu cầu' }, { status: 400 })
  } catch (error) {
    return platformJson(error, 'Không lưu được khách của thiệp gốc')
  }
}
