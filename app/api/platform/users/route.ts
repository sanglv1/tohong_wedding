import { NextResponse } from 'next/server'
import { logPlatformFailure, PlatformError } from '@/lib/platform/errors'
import { getSessionUser } from '@/lib/platform/session'
import { createMember, listUsersForAdmin } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function adminOrResponse() {
  const user = await getSessionUser()
  if (!user) return { user: null, response: NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 }) }
  if (user.role !== 'admin') {
    return { user: null, response: NextResponse.json({ error: 'Chỉ tài khoản quản trị mới cấp được tài khoản' }, { status: 403 }) }
  }
  return { user, response: null }
}

export async function GET() {
  try {
    const gate = await adminOrResponse()
    if (gate.response) return gate.response
    return NextResponse.json({ users: await listUsersForAdmin() })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đọc được danh sách' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  try {
    const gate = await adminOrResponse()
    if (gate.response) return gate.response
    const body = (await request.json()) as { username?: unknown; password?: unknown; name?: unknown }
    await createMember({
      username: typeof body.username === 'string' ? body.username : '',
      password: typeof body.password === 'string' ? body.password : '',
      name: typeof body.name === 'string' ? body.name : '',
    })
    return NextResponse.json({ users: await listUsersForAdmin() })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không tạo được tài khoản' }, { status: 502 })
  }
}
