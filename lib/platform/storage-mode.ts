import { PlatformError } from './errors'

/** Production và Vercel không được âm thầm ghi thiệp ra ổ đĩa tạm. */
export function storageKind(input: { redis: boolean; production: boolean; vercel: boolean }): 'redis' | 'file' {
  if (input.redis) return 'redis'
  if (input.production || input.vercel) {
    throw new PlatformError(
      'Nền tảng cần Upstash Redis (KV_REST_API_URL và KV_REST_API_TOKEN). Không lưu thiệp trên ổ đĩa tạm của máy chủ.',
      503,
    )
  }
  return 'file'
}
