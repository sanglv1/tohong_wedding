import { NextResponse } from 'next/server'
import { logPlatformFailure, PlatformError } from '@/lib/platform/errors'
import { applySession } from '@/lib/platform/session'
import { countUsers, createUser } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Không hỗ trợ' }, { status: 404 })
    }
    if ((await countUsers()) > 0) {
      return NextResponse.json({ error: 'Đã có tài khoản quản trị' }, { status: 403 })
    }
    const body = (await request.json()) as { username?: unknown; password?: unknown; name?: unknown }
    const user = await createUser({
      username: typeof body.username === 'string' ? body.username : '',
      password: typeof body.password === 'string' ? body.password : '',
      name: typeof body.name === 'string' ? body.name : '',
      role: 'admin',
    })
    const response = NextResponse.json({ ok: true, role: user.role })
    applySession(response, user.id)
    return response
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không tạo được tài khoản' }, { status: 502 })
  }
}
