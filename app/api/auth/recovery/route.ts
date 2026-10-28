import { NextResponse } from 'next/server'
import { platformJson } from '@/lib/platform/http'
import { issueRecoveryCode, redeemRecoveryCode } from '@/lib/platform/recovery'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string; username?: string; code?: string; password?: string }
    if (body.action === 'issue') {
      const user = await getSessionUser()
      if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
      const code = await issueRecoveryCode(user.id)
      return NextResponse.json({ code })
    }
    await redeemRecoveryCode(String(body.username ?? ''), String(body.code ?? ''), String(body.password ?? ''))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return platformJson(error, 'Không khôi phục được mật khẩu')
  }
}
