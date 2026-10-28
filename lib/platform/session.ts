import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { PlatformError } from './errors'
import { findUserById, toPublicUser } from './store'
import type { PublicUser } from './types'

export const SESSION_COOKIE = 'wd_session'
export const OAUTH_COOKIE = 'wd_oauth'
const MAX_AGE = 60 * 60 * 24 * 14
const OAUTH_MAX_AGE = 60 * 10

function secret() {
  const value = process.env.PLATFORM_SECRET
  if (value && value.length >= 16) return value
  if (process.env.NODE_ENV === 'production') return null
  return 'dev-only-platform-secret'
}

export function signSession(userId: string) {
  const key = secret()
  if (!key) throw new PlatformError('Chưa cấu hình PLATFORM_SECRET trên máy chủ', 503)
  const body = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url')
  const sig = createHmac('sha256', key).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function readSession(token: string | undefined | null) {
  if (!token) return null
  const key = secret()
  if (!key) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', key).update(body).digest('base64url')
  const actual = Buffer.from(sig)
  const wanted = Buffer.from(expected)
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as { uid?: unknown; exp?: unknown }
    if (typeof data.uid !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return { uid: data.uid }
  } catch {
    return null
  }
}

export function signOAuthState(nextPath: string, from: 'dang-nhap' | 'dang-ky') {
  const key = secret()
  if (!key) throw new PlatformError('Chưa cấu hình PLATFORM_SECRET trên máy chủ', 503)
  const body = Buffer.from(
    JSON.stringify({ next: nextPath, from, exp: Date.now() + OAUTH_MAX_AGE * 1000, n: randomBytes(8).toString('hex') }),
  ).toString('base64url')
  const sig = createHmac('sha256', key).update(`oauth.${body}`).digest('base64url')
  return `${body}.${sig}`
}

export function readOAuthState(token: string | undefined | null) {
  if (!token) return null
  const key = secret()
  if (!key) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', key).update(`oauth.${body}`).digest('base64url')
  const actual = Buffer.from(sig)
  const wanted = Buffer.from(expected)
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as { next?: unknown; from?: unknown; exp?: unknown }
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    if (typeof data.next !== 'string') return null
    if (data.next !== '' && (!data.next.startsWith('/') || data.next.startsWith('//') || data.next.includes('\\'))) return null
    const from = data.from === 'dang-ky' ? 'dang-ky' : 'dang-nhap'
    return { next: data.next, from } as const
  } catch {
    return null
  }
}

export function oauthCookieOptions(maxAge = OAUTH_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

export function applySession(response: { cookies: { set: (name: string, value: string, options: object) => void } }, userId: string) {
  response.cookies.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function clearSession(response: { cookies: { set: (name: string, value: string, options: object) => void } }) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const jar = await cookies()
  const session = readSession(jar.get(SESSION_COOKIE)?.value)
  if (!session) return null
  const user = await findUserById(session.uid)
  if (!user) return null
  return toPublicUser(user)
}
