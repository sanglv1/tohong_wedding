import { timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { facebookProfile, facebookRedirectUri, publicOrigin } from '@/lib/platform/facebook'
import { logPlatformFailure, PlatformError } from '@/lib/platform/errors'
import { applySession, OAUTH_COOKIE, oauthCookieOptions, readOAuthState } from '@/lib/platform/session'
import { signInWithFacebook } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sameToken(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function back(origin: string, from: 'dang-nhap' | 'dang-ky', loi: string) {
  const url = new URL(from === 'dang-ky' ? '/dang-ky' : '/dang-nhap', origin)
  url.searchParams.set('loi', loi)
  const response = NextResponse.redirect(url)
  response.cookies.set(OAUTH_COOKIE, '', oauthCookieOptions(0))
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = publicOrigin(url)
  const jar = await cookies()
  const cookie = jar.get(OAUTH_COOKIE)?.value ?? ''
  const state = url.searchParams.get('state') ?? ''
  const parsed = cookie && state && sameToken(cookie, state) ? readOAuthState(state) : null
  const from = parsed?.from ?? 'dang-nhap'
  if (!parsed) return back(origin, 'dang-nhap', 'thatbai')

  const denied = url.searchParams.get('error')
  if (denied) return back(origin, from, denied === 'access_denied' ? 'huy' : 'thatbai')

  const code = url.searchParams.get('code') ?? ''
  if (!code || code.length > 512) return back(origin, from, 'thatbai')

  try {
    const profile = await facebookProfile(code, facebookRedirectUri(origin))
    const user = await signInWithFacebook(profile)
    const destination =
      user.role === 'admin' && !parsed.next.startsWith('/studio') ? '/quan-tri-nen-tang' : parsed.next || '/studio'
    const response = NextResponse.redirect(new URL(destination, origin))
    applySession(response, user.id)
    response.cookies.set(OAUTH_COOKIE, '', oauthCookieOptions(0))
    return response
  } catch (error) {
    if (!(error instanceof PlatformError)) logPlatformFailure(error)
    return back(origin, from, 'thatbai')
  }
}
