import { NextResponse } from 'next/server'
import { PlatformError, logPlatformFailure } from '@/lib/platform/errors'
import { getOrder, setOrderStatus } from '@/lib/platform/ledger'
import { getSessionUser } from '@/lib/platform/session'
import { getOwnedInvitation } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { id: string }

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const order = await getOrder((await context.params).id)
    if (!order || (order.userId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Không thấy đơn' }, { status: 404 })
    }
    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đọc được đơn' }, { status: 502 })
  }
}

export async function POST(request: Request, context: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Chỉ quản trị xác nhận đơn' }, { status: 403 })
    const body = (await request.json()) as { action?: unknown }
    const order = await getOrder((await context.params).id)
    if (!order) return NextResponse.json({ error: 'Không thấy đơn' }, { status: 404 })
    if (body.action === 'hoan' && order.plan === 'mot-thiep' && order.invitationId) {
      const invite = await getOwnedInvitation(order.userId, order.invitationId)
      if (invite?.published) {
        return NextResponse.json({ error: 'Hãy bảo chủ thiệp gỡ xuất bản trước khi hoàn tiền.' }, { status: 409 })
      }
    }
    if (body.action !== 'xac-nhan' && body.action !== 'hoan') {
      return NextResponse.json({ error: 'Thao tác không hợp lệ' }, { status: 400 })
    }
    const next = await setOrderStatus(order.id, body.action === 'xac-nhan' ? 'da-tra' : 'hoan')
    return NextResponse.json({ order: next })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không cập nhật được đơn' }, { status: 502 })
  }
}
