import { PlatformError } from './errors'

const GRAPH = 'v26.0'

export function facebookConfigured() {
  return Boolean(process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_APP_SECRET?.trim())
}

/** Bản chạy trên máy dùng đúng địa chỉ trình duyệt. Bản deploy ưu tiên NEXT_PUBLIC_SITE_URL. */
export function publicOrigin(requestUrl: URL) {
  if (process.env.NODE_ENV !== 'production') return requestUrl.origin
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!configured || configured.includes('your-domain')) return requestUrl.origin
  try {
    return new URL(configured).origin
  } catch {
    return requestUrl.origin
  }
}

export function facebookRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, '')}/api/auth/facebook/callback`
}

export function facebookDialogUrl(redirectUri: string, state: string) {
  const appId = process.env.FACEBOOK_APP_ID?.trim() ?? ''
  const url = new URL(`https://www.facebook.com/${GRAPH}/dialog/oauth`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', 'email,public_profile')
  url.searchParams.set('response_type', 'code')
  return url.toString()
}

export function facebookNotice(code: string | undefined) {
  if (code === 'facebook') return 'Đăng nhập Facebook chưa bật. Hãy dùng email và mật khẩu.'
  if (code === 'huy') return 'Bạn đã đóng cửa sổ Facebook.'
  if (code === 'thatbai') return 'Không đăng nhập bằng Facebook được. Hãy thử lại hoặc dùng email.'
  return ''
}

/** Đổi mã Facebook lấy tên và email. Không ghi token ra log. */
export async function facebookProfile(code: string, redirectUri: string) {
  const appId = process.env.FACEBOOK_APP_ID?.trim() ?? ''
  const secret = process.env.FACEBOOK_APP_SECRET?.trim() ?? ''
  if (!appId || !secret) throw new PlatformError('Đăng nhập Facebook chưa bật', 503)
  const tokenRes = await fetch(`https://graph.facebook.com/${GRAPH}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      client_secret: secret,
      code,
    }),
    cache: 'no-store',
  })
  if (!tokenRes.ok) throw new PlatformError('Facebook không cấp quyền', 401)
  const tokenBody = (await tokenRes.json()) as { access_token?: unknown }
  const accessToken = typeof tokenBody.access_token === 'string' ? tokenBody.access_token : ''
  if (!accessToken) throw new PlatformError('Facebook không cấp quyền', 401)

  const meUrl = new URL(`https://graph.facebook.com/${GRAPH}/me`)
  meUrl.searchParams.set('fields', 'id,name,email')
  meUrl.searchParams.set('access_token', accessToken)
  const meRes = await fetch(meUrl, { cache: 'no-store' })
  if (!meRes.ok) throw new PlatformError('Không đọc được tài khoản Facebook', 401)
  const me = (await meRes.json()) as { id?: unknown; name?: unknown; email?: unknown }
  if (typeof me.id !== 'string' || !/^\d{1,32}$/.test(me.id)) throw new PlatformError('Facebook không trả về mã người dùng')
  return {
    id: me.id,
    name: typeof me.name === 'string' ? me.name : '',
    email: typeof me.email === 'string' ? me.email : undefined,
  }
}
