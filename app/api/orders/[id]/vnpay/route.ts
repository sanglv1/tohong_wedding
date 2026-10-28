import { NextResponse } from 'next/server'
import { publicOrigin } from '@/lib/platform/facebook'
import { platformJson } from '@/lib/platform/http'
import { attachVnpayAttempt, getOrder } from '@/lib/platform/ledger'
import { getSessionUser } from '@/lib/platform/session'
import { buildPayUrl, newTxnRef, orderInfoFor, readVnpayConfig, requestIp } from '@/lib/platform/vnpay'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { id: string }

export async function POST(request: Request, context: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const order = await getOrder((await context.params).id)
    if (!order || (order.userId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Không thấy đơn' }, { status: 404 })
    }
    if (order.status !== 'cho') return NextResponse.json({ error: 'Đơn không còn chờ thanh toán' }, { status: 409 })
    const origin = publicOrigin(new URL(request.url))
    const config = readVnpayConfig(`${origin}/api/vnpay/return`)
    if (!config) return NextResponse.json({ error: 'Cổng VNPAY chưa được cấu hình' }, { status: 503 })
    const txnRef = newTxnRef(order.id)
    await attachVnpayAttempt(order.id, txnRef)
    const url = buildPayUrl(config, {
      amountVnd: order.amount,
      txnRef,
      orderInfo: orderInfoFor(order.code),
      clientIp: requestIp(request.headers),
    })
    console.info(`VNPAY pay ${txnRef}`)
    return NextResponse.json({ url })
  } catch (error) {
    return platformJson(error, 'Không tạo được phiên thanh toán')
  }
}
