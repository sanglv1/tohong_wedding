import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PlatformError } from './errors'
import { awsAuthorization, mediaWriteBackend, objectKey, readObjectStorageConfig, signObjectRequest } from './object-store'

test('production thiếu object storage thì không ghi ảnh', () => {
  assert.equal(mediaWriteBackend({ objectStorage: true, production: true, vercel: true }), 'object')
  assert.equal(mediaWriteBackend({ objectStorage: false, production: false, vercel: false }), 'file')
  assert.throws(() => mediaWriteBackend({ objectStorage: false, production: true, vercel: false }), (error: unknown) => {
    return error instanceof PlatformError && error.status === 503
  })
  assert.equal(objectKey('Abcd1234_-abcd12'), 'media/Abcd1234_-abcd12')
})

test('thiếu một biến thì không nhận object storage', () => {
  assert.equal(
    readObjectStorageConfig({
      OBJECT_STORAGE_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
      OBJECT_STORAGE_BUCKET: 'to-hong',
      OBJECT_STORAGE_ACCESS_KEY_ID: 'key',
      OBJECT_STORAGE_SECRET_ACCESS_KEY: '',
    }),
    null,
  )
  const config = readObjectStorageConfig({
    OBJECT_STORAGE_ENDPOINT: 'https://example.r2.cloudflarestorage.com/extra',
    OBJECT_STORAGE_BUCKET: 'to-hong',
    OBJECT_STORAGE_ACCESS_KEY_ID: 'key',
    OBJECT_STORAGE_SECRET_ACCESS_KEY: 'secret',
  })
  assert.equal(config, null)
})

test('chữ ký S3 khớp vector AWS và URL là path-style', () => {
  const signed = awsAuthorization({
    method: 'GET',
    canonicalUri: '/test.txt',
    host: 'examplebucket.s3.amazonaws.com',
    region: 'us-east-1',
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    amzDate: '20130524T000000Z',
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    headers: { range: 'bytes=0-9' },
  })
  assert.equal(signed.signature, 'f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41')

  const request = signObjectRequest({
    config: {
      endpoint: 'https://example.r2.cloudflarestorage.com',
      bucket: 'to-hong',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      region: 'auto',
    },
    method: 'PUT',
    key: 'media/abcdefghijklmnop',
    body: Buffer.from('jpeg'),
    contentType: 'image/jpeg',
    now: new Date('2026-10-28T07:00:00.000Z'),
  })
  assert.equal(request.url, 'https://example.r2.cloudflarestorage.com/to-hong/media/abcdefghijklmnop')
  assert.match(request.headers.Authorization, /SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date/)
  assert.equal(request.headers['Content-Type'], 'image/jpeg')
  assert.equal(request.headers['Content-Length'], '4')
})
