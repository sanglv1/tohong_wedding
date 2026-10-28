import { NextResponse } from 'next/server'
import { PlatformError, logPlatformFailure } from '@/lib/platform/errors'
import { listNotices } from '@/lib/platform/ledger'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    return NextResponse.json({ notices: await listNotices(user.id) })
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đọc được thông báo' }, { status: 502 })
  }
}
