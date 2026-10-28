import { NextResponse } from 'next/server'
import { applySession } from '@/lib/platform/session'
import { createMember, createMemberByEmail } from '@/lib/platform/store'
import { PlatformError, logPlatformFailure } from '@/lib/platform/errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown; name?: unknown; email?: unknown }
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name : ''
    const user = email
      ? await createMemberByEmail({ name, email, password })
      : await createMember({
          username: typeof body.username === 'string' ? body.username : '',
          password,
          name,
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
