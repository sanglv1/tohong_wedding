export class PlatformError extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'PlatformError'
    this.status = status
  }
}

/** Ghi log lỗi hạ tầng, bỏ qua nội dung có thể chứa mật khẩu hoặc khóa. */
export function logPlatformFailure(error: unknown) {
  const message = error instanceof Error ? error.message : 'unknown'
  if (/scrypt\$|PLATFORM_SECRET|Bearer |KV_REST|UPSTASH|password|AWS4-HMAC-SHA256|OBJECT_STORAGE_SECRET/i.test(message)) {
    console.error('Platform storage failed')
    return
  }
  console.error(message)
}
