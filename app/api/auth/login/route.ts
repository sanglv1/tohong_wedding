import { NextResponse } from 'next/server'
import { clientIp, isRedisConfigured, pipeline } from '@/lib/redis'
import { logPlatformFailure, PlatformError } from '@/lib/platform/errors'
import { judgeLoginAttempts, LOGIN_WINDOW_SECONDS, loginAttemptKey, loginLimitMode } from '@/lib/platform/login-limit'
import { verifyPassword } from '@/lib/platform/password'
import { applySession } from '@/lib/platform/session'
import { normalizeUsername } from '@/lib/platform/slug'
import { normalizeEmail } from '@/lib/platform/identity'
import { ensureSeedAdmin, findUserByEmail, findUserByUsername } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DUMMY_HASH = `scrypt$${ 'ab'.repeat(16) }$${ 'cd'.repeat(32) }`
const UNAVAILABLE = 'Không kiểm tra được lần đăng nhập. Hãy thử lại sau.'

function limitMode() {
  return loginLimitMode({
    redis: isRedisConfigured,
    production: process.env.NODE_ENV === 'production',
    vercel: process.env.VERCEL === '1',
  })
}

async function assertLoginAllowed(ip: string, mode: ReturnType<typeof limitMode>) {
  if (mode === 'open') return
  if (mode === 'unavailable') throw new PlatformError(UNAVAILABLE, 503)
  let count: number
  try {
    const [raw] = await pipeline([['GET', loginAttemptKey(ip)]])
    count = raw == null || raw === '' ? 0 : Number(raw)
  } catch {
    throw new PlatformError(UNAVAILABLE, 503)
  }
  const decision = judgeLoginAttempts(count)
  if (decision === 'unavailable') throw new PlatformError(UNAVAILABLE, 503)
  if (decision === 'lock') throw new PlatformError('Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.', 429)
}

async function noteFailure(ip: string, mode: ReturnType<typeof limitMode>) {
  if (mode !== 'redis') return
  try {
    await pipeline([
      ['INCR', loginAttemptKey(ip)],
      ['EXPIRE', loginAttemptKey(ip), LOGIN_WINDOW_SECONDS, 'NX'],
    ])
  } catch {
    throw new PlatformError('Không ghi được lần đăng nhập sai. Hãy thử lại sau.', 503)
  }
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request)
    const mode = limitMode()
    await assertLoginAllowed(ip, mode)
    await ensureSeedAdmin()

    const body = (await request.json()) as { username?: unknown; password?: unknown; account?: unknown; email?: unknown }
    const raw =
      (typeof body.account === 'string' && body.account.trim()) ||
      (typeof body.email === 'string' && body.email.trim()) ||
      (typeof body.username === 'string' && body.username.trim()) ||
      ''
    const password = typeof body.password === 'string' ? body.password : ''
    const byEmail = raw.includes('@')
    const user = byEmail
      ? await findUserByEmail(normalizeEmail(raw) || raw)
      : await findUserByUsername(normalizeUsername(raw))
    const matched = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, DUMMY_HASH).then(() => false)
    if (!user || !matched) {
      await noteFailure(ip, mode)
      throw new PlatformError(byEmail ? 'Sai email hoặc mật khẩu' : 'Sai tên đăng nhập hoặc mật khẩu', 401)
    }

    const response = NextResponse.json({ ok: true, role: user.role })
    applySession(response, user.id)
    return response
  } catch (error) {
    if (error instanceof PlatformError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    logPlatformFailure(error)
    return NextResponse.json({ error: 'Không đăng nhập được lúc này' }, { status: 502 })
  }
}
