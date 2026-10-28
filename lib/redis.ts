import { timingSafeEqual } from 'node:crypto'

/**
 * Upstash Redis qua REST API - dùng chung cho sổ lưu bút, xác nhận tham dự và danh sách khách mời.
 * Cài từ Vercel (Storage → Upstash Redis) sẽ tự có KV_REST_API_URL / KV_REST_API_TOKEN;
 * tạo database trực tiếp trên upstash.com thì dùng UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
 */
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
/** Tiền tố khóa để nhiều thiệp dùng chung một database, ví dụ "trangdat:" */
const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || ''

const AUTH_LIMIT = { max: 10, windowSeconds: 900 }

export const isRedisConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

type RedisResult = { result?: unknown; error?: string }

/**
 * EVAL không đi qua `pipeline`: pipeline luôn gắn tiền tố vào đối số thứ hai,
 * trong khi đối số thứ hai của EVAL là mã script chứ không phải khóa.
 * `keys` là khóa logic (chưa có REDIS_KEY_PREFIX).
 */
export async function redisEval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Redis storage is not configured')
  const command = ['EVAL', script, keys.length, ...keys.map((key) => `${KEY_PREFIX}${key}`), ...args]
  const res = await fetch(REDIS_URL.replace(/\/$/, ''), {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  const data = (await res.json()) as RedisResult
  if (data.error) throw new Error(`Redis: ${data.error}`)
  return data.result
}

export async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Redis storage is not configured')
  const res = await fetch(`${REDIS_URL.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    // Mọi lệnh đang dùng đều chỉ có một khóa, nằm ở vị trí thứ hai
    body: JSON.stringify(commands.map(([cmd, key, ...rest]) => [cmd, `${KEY_PREFIX}${key}`, ...rest])),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  const results = (await res.json()) as RedisResult[]
  const failed = results.find((r) => r.error)
  if (failed) throw new Error(`Redis: ${failed.error}`)
  return results.map((r) => r.result)
}

/** HGETALL trả về mảng phẳng [field, value, field, value, ...] */
export function hashValues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((_, i) => i % 2 === 1).filter((v): v is string => typeof v === 'string')
}

export const notConfigured = () => Response.json({ error: 'Chưa kết nối Upstash Redis' }, { status: 503 })

export function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/** Trả về false khi IP này đã thực hiện quá số lần cho phép trong khoảng thời gian giới hạn */
export async function allowAttempt(key: string, limit: { max: number; windowSeconds: number }) {
  const [count] = await pipeline([
    ['INCR', key],
    ['EXPIRE', key, limit.windowSeconds, 'NX'],
  ])
  return Number(count) <= limit.max
}

function passwordMatches(input: string | null) {
  const expected = process.env.GUESTBOOK_ADMIN_PASSWORD
  if (!expected || !input) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Trả về Response lỗi nếu không được phép, null nếu mật khẩu quản lý đúng */
export async function rejectIfWrongPassword(request: Request): Promise<Response | null> {
  if (!process.env.GUESTBOOK_ADMIN_PASSWORD) {
    return Response.json({ error: 'Chưa đặt GUESTBOOK_ADMIN_PASSWORD' }, { status: 503 })
  }
  const key = `guestbook:auth:${clientIp(request)}`
  const locked = Response.json({ error: 'Nhập sai quá nhiều lần, thử lại sau 15 phút' }, { status: 429 })
  const [failures] = await pipeline([['GET', key]])
  if (Number(failures) >= AUTH_LIMIT.max) return locked
  if (passwordMatches(request.headers.get('x-admin-password'))) return null
  if (!(await allowAttempt(key, AUTH_LIMIT))) return locked
  return Response.json({ error: 'Sai mật khẩu' }, { status: 401 })
}

/** Bọc route quản lý: kiểm tra cấu hình + mật khẩu, bắt lỗi Redis */
export async function withAdmin(request: Request, handler: () => Promise<Response>, failMessage: string) {
  if (!isRedisConfigured) return notConfigured()
  try {
    return (await rejectIfWrongPassword(request)) ?? (await handler())
  } catch {
    return Response.json({ error: failMessage }, { status: 502 })
  }
}
