import { NextResponse } from 'next/server'
import { logPlatformFailure, PlatformError } from '@/lib/platform/errors'
import { getSessionUser } from '@/lib/platform/session'
import { deleteUserById, listUsersForAdmin, setUserPassword } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function adminOrResponse() {
  const user = await getSessionUser()
  if (!user) return { user: null, response: NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 }) }
  if (user.role !== 'admin') {
    return { user: null, response: NextResponse.json({ error: 'Chỉ tài khoản quản trị mới làm được việc này' }, { status: 403 }) }
  }
  return { user, response: null }
}

type Params = { id: string }

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  try {
    const gate = await adminOrResponse()
    if (gate.response) return gate.response
    const { id } = await context.params
    const body = (await request.json()) as { password?: unknown }
    if (typeof body.password !== 'string') return NextResponse.json({ error: 'Thiếu mật khẩu mới' }, { status: 400 })
    await setUserPassword(id, body.password)
    return NextResponse.json({ users: await listUsersForAdmin() })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đổi được mật khẩu' }, { status: 502 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  try {
    const gate = await adminOrResponse()
    if (gate.response) return gate.response
    const { id } = await context.params
    if (gate.user?.id === id) return NextResponse.json({ error: 'Không xóa chính tài khoản đang đăng nhập' }, { status: 400 })
    await deleteUserById(id)
    return NextResponse.json({ users: await listUsersForAdmin() })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không xóa được tài khoản' }, { status: 502 })
  }
}
