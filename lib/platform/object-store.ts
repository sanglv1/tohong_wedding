import { createHash, createHmac, type BinaryLike } from 'node:crypto'
import { PlatformError } from './errors'

const EMPTY_PAYLOAD_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

export type ObjectStorageConfig = {
  endpoint: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  region: string
}

type Env = Record<string, string | undefined>
type Method = 'GET' | 'PUT' | 'DELETE' | 'HEAD'

export function readObjectStorageConfig(env: Env = process.env): ObjectStorageConfig | null {
  const endpoint = env.OBJECT_STORAGE_ENDPOINT?.trim() ?? ''
  const bucket = env.OBJECT_STORAGE_BUCKET?.trim() ?? ''
  const accessKeyId = env.OBJECT_STORAGE_ACCESS_KEY_ID?.trim() ?? ''
  const secretAccessKey = env.OBJECT_STORAGE_SECRET_ACCESS_KEY?.trim() ?? ''
  const region = env.OBJECT_STORAGE_REGION?.trim() || 'auto'
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null
  if (bucket.includes('/') || bucket.includes(' ')) return null
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.pathname !== '/' && url.pathname !== '') return null
  return { endpoint: url.origin, bucket, accessKeyId, secretAccessKey, region }
}

/** Production không được nhét byte ảnh vào Redis hay ổ tạm. Máy dev thiếu cấu hình thì ghi file. */
export function mediaWriteBackend(input: { objectStorage: boolean; production: boolean; vercel: boolean }): 'object' | 'file' {
  if (input.objectStorage) return 'object'
  if (input.production || input.vercel) {
    throw new PlatformError(
      'Nền tảng cần object storage để lưu ảnh và nhạc. Điền OBJECT_STORAGE_ENDPOINT, OBJECT_STORAGE_BUCKET, OBJECT_STORAGE_ACCESS_KEY_ID và OBJECT_STORAGE_SECRET_ACCESS_KEY. Redis chỉ giữ mã và quyền xem.',
      503,
    )
  }
  return 'file'
}

export function objectKey(id: string) {
  return `media/${id}`
}

function sha256Hex(body: string | Buffer) {
  return createHash('sha256').update(body).digest('hex')
}

function hmacRaw(key: BinaryLike, data: string) {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}

function signingKey(secret: string, dateStamp: string, region: string) {
  const kDate = hmacRaw(`AWS4${secret}`, dateStamp)
  const kRegion = hmacRaw(kDate, region)
  const kService = hmacRaw(kRegion, 's3')
  return hmacRaw(kService, 'aws4_request')
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export function formatAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

/**
 * Chữ ký AWS Signature Version 4. `headers` là header đã lowercase, không gồm host và x-amz-*.
 * Hàm tự thêm host, x-amz-date, x-amz-content-sha256.
 */
export function awsAuthorization(input: {
  method: string
  canonicalUri: string
  host: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  amzDate: string
  payloadHash: string
  headers?: Record<string, string>
}) {
  const headers: Record<string, string> = {
    ...(input.headers ?? {}),
    host: input.host,
    'x-amz-content-sha256': input.payloadHash,
    'x-amz-date': input.amzDate,
  }
  const signedHeaderNames = Object.keys(headers).sort()
  const canonicalHeaders = `${signedHeaderNames.map((name) => `${name}:${headers[name].trim()}`).join('\n')}\n`
  const canonical = [
    input.method,
    input.canonicalUri,
    '',
    canonicalHeaders,
    signedHeaderNames.join(';'),
    input.payloadHash,
  ].join('\n')
  const dateStamp = input.amzDate.slice(0, 8)
  const scope = `${dateStamp}/${input.region}/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', input.amzDate, scope, sha256Hex(canonical)].join('\n')
  const signature = createHmac('sha256', signingKey(input.secretAccessKey, dateStamp, input.region))
    .update(stringToSign, 'utf8')
    .digest('hex')
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`,
    signedHeaders: signedHeaderNames.join(';'),
    signature,
  }
}

export function signObjectRequest(input: {
  config: ObjectStorageConfig
  method: Method
  key: string
  body?: Buffer
  contentType?: string
  now?: Date
}) {
  const endpoint = new URL(input.config.endpoint)
  const canonicalUri = `/${encodePath(input.config.bucket)}/${encodePath(input.key)}`
  const amzDate = formatAmzDate(input.now ?? new Date())
  const payload = input.body ?? Buffer.alloc(0)
  const payloadHash = input.method === 'GET' || input.method === 'HEAD' || input.method === 'DELETE' ? EMPTY_PAYLOAD_HASH : sha256Hex(payload)
  const extra = input.contentType ? { 'content-type': input.contentType } : undefined
  const signed = awsAuthorization({
    method: input.method,
    canonicalUri,
    host: endpoint.host,
    region: input.config.region,
    accessKeyId: input.config.accessKeyId,
    secretAccessKey: input.config.secretAccessKey,
    amzDate,
    payloadHash,
    headers: extra,
  })
  const headers: Record<string, string> = {
    Authorization: signed.authorization,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  if (input.contentType) headers['Content-Type'] = input.contentType
  if (input.method === 'PUT') headers['Content-Length'] = String(payload.length)
  return { url: `${endpoint.origin}${canonicalUri}`, headers }
}

async function send(config: ObjectStorageConfig, method: Method, key: string, body?: Buffer, contentType?: string) {
  const signed = signObjectRequest({ config, method, key, body, contentType })
  const response = await fetch(signed.url, {
    method,
    headers: signed.headers,
    body: body ? new Uint8Array(body) : undefined,
    cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status !== 404) console.error(`Object storage ${method} ${response.status}`)
    await response.arrayBuffer().catch(() => undefined)
  } else if (method !== 'GET') {
    await response.arrayBuffer().catch(() => undefined)
  }
  return response
}

function requireConfig(config?: ObjectStorageConfig | null) {
  const resolved = config ?? readObjectStorageConfig()
  if (!resolved) throw new PlatformError('Chưa cấu hình object storage', 503)
  return resolved
}

export async function putObject(key: string, body: Buffer, contentType: string, config?: ObjectStorageConfig | null) {
  const resolved = requireConfig(config)
  const response = await send(resolved, 'PUT', key, body, contentType)
  if (!response.ok) throw new PlatformError('Không lưu được file lên object storage', 502)
}

export async function getObject(key: string, config?: ObjectStorageConfig | null): Promise<Buffer | null> {
  const resolved = requireConfig(config)
  const response = await send(resolved, 'GET', key)
  if (response.status === 404) return null
  if (!response.ok) throw new PlatformError('Không đọc được file trên object storage', 502)
  return Buffer.from(await response.arrayBuffer())
}

export async function objectExists(key: string, config?: ObjectStorageConfig | null) {
  const resolved = requireConfig(config)
  const response = await send(resolved, 'HEAD', key)
  if (response.status === 404) return false
  if (!response.ok) throw new PlatformError('Không kiểm tra được file trên object storage', 502)
  return true
}

export async function deleteObject(key: string, config?: ObjectStorageConfig | null) {
  const resolved = requireConfig(config)
  const response = await send(resolved, 'DELETE', key)
  if (response.status === 404 || response.ok) return
  throw new PlatformError('Không xóa được file trên object storage', 502)
}
