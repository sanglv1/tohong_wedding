import { NextResponse } from 'next/server'
import { facebookConfigured, facebookDialogUrl, facebookRedirectUri, publicOrigin } from '@/lib/platform/facebook'
import { OAUTH_COOKIE, oauthCookieOptions, signOAuthState } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return ''
  return value
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = publicOrigin(url)
  const from = url.searchParams.get('from') === 'dang-ky' ? 'dang-ky' : 'dang-nhap'
  const back = new URL(from === 'dang-ky' ? '/dang-ky' : '/dang-nhap', origin)
  if (!facebookConfigured()) {
    back.searchParams.set('loi', 'facebook')
    return NextResponse.redirect(back)
  }
  try {
    const state = signOAuthState(safeNext(url.searchParams.get('next')), from)
    const response = NextResponse.redirect(facebookDialogUrl(facebookRedirectUri(origin), state))
    response.cookies.set(OAUTH_COOKIE, state, oauthCookieOptions())
    return response
  } catch {
    back.searchParams.set('loi', 'thatbai')
    return NextResponse.redirect(back)
  }
}
