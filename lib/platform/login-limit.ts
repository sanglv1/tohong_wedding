export const LOGIN_ATTEMPT_LIMIT = 8
export const LOGIN_WINDOW_SECONDS = 15 * 60

export function loginAttemptKey(ip: string) {
  return `platform:login:${ip}`
}

/**
 * Chỉ Redis đếm lần đăng nhập sai khi Redis có mặt.
 * Production thiếu Redis thì không mở cửa. Máy dev chưa gắn Redis thì không giới hạn, vì chỉ có một tiến trình.
 */
export function loginLimitMode(input: { redis: boolean; production: boolean; vercel: boolean }): 'redis' | 'open' | 'unavailable' {
  if (input.redis) return 'redis'
  if (input.production || input.vercel) return 'unavailable'
  return 'open'
}

/** `count` là số lần sai Redis đang giữ. Giá trị không đọc được thì từ chối. */
export function judgeLoginAttempts(count: number): 'allow' | 'lock' | 'unavailable' {
  if (!Number.isFinite(count) || count < 0) return 'unavailable'
  return count >= LOGIN_ATTEMPT_LIMIT ? 'lock' : 'allow'
}
