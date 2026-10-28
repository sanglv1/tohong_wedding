import { NextResponse } from 'next/server'
import { PlatformError, logPlatformFailure } from '@/lib/platform/errors'
import { addTicket, listTickets } from '@/lib/platform/ledger'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Chỉ quản trị xem được yêu cầu hỗ trợ' }, { status: 403 })
    return NextResponse.json({ tickets: await listTickets() })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đọc được yêu cầu' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    const body = (await request.json()) as { name?: unknown; contact?: unknown; message?: unknown }
    const ticket = await addTicket({
      userId: user?.id ?? null,
      name: typeof body.name === 'string' ? body.name : '',
      contact: typeof body.contact === 'string' ? body.contact : '',
      message: typeof body.message === 'string' ? body.message : '',
    })
    return NextResponse.json({ ticket })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không gửi được' }, { status: 502 })
  }
}
