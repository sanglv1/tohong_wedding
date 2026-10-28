import { NextResponse } from 'next/server'
import { buildBackup, restoreBackup } from '@/lib/platform/backup'
import { platformJson } from '@/lib/platform/http'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Chỉ quản trị sao lưu được' }, { status: 403 })
  return null
}

export async function GET() {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    const backup = await buildBackup()
    return new NextResponse(JSON.stringify(backup), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="webding-sao-luu.json"',
      },
    })
  } catch (error) {
    return platformJson(error, 'Không tạo được bản sao lưu')
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    const body = await request.json()
    await restoreBackup(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return platformJson(error, 'Không khôi phục được')
  }
}
