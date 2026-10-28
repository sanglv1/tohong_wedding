import { NextResponse } from 'next/server'
import { planById } from '@/lib/platform/commerce'
import { PlatformError, logPlatformFailure } from '@/lib/platform/errors'
import { createOrder, listOrders } from '@/lib/platform/ledger'
import { getSessionUser } from '@/lib/platform/session'
import { getOwnedInvitation } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const all = new URL(request.url).searchParams.get('tat-ca') === '1'
    if (all && user.role !== 'admin') return NextResponse.json({ error: 'Chỉ quản trị xem được mọi đơn' }, { status: 403 })
    return NextResponse.json({ orders: await listOrders(all ? undefined : user.id) })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đọc được đơn' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const body = (await request.json()) as { plan?: unknown; invitationId?: unknown }
    const plan = typeof body.plan === 'string' ? planById(body.plan) : null
    if (!plan) return NextResponse.json({ error: 'Gói không hợp lệ' }, { status: 400 })
    const invitationId = typeof body.invitationId === 'string' ? body.invitationId : null
    if (plan.id === 'mot-thiep') {
      if (!invitationId) return NextResponse.json({ error: 'Hãy chọn thiệp cần xuất bản' }, { status: 400 })
      const invite = await getOwnedInvitation(user.id, invitationId)
      if (!invite) return NextResponse.json({ error: 'Không thấy thiệp' }, { status: 404 })
    }
    const order = await createOrder({ userId: user.id, plan: plan.id, invitationId })
    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không tạo được đơn' }, { status: 502 })
  }
}
