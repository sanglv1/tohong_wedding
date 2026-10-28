import { NextResponse } from 'next/server'
import { bankDetails } from '@/lib/platform/commerce'
import { PlatformError } from '@/lib/platform/errors'
import { readObjectStorageConfig } from '@/lib/platform/object-store'
import { isRedisConfigured } from '@/lib/redis'
import { storageMode } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'

function mediaStatus() {
  if (readObjectStorageConfig()) return 'object'
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return 'chua-gan'
  return 'file'
}

export async function GET() {
  try {
    const storage = isRedisConfigured ? 'redis' : storageMode()
    return NextResponse.json({
      storage,
      media: mediaStatus(),
      paymentsReady: bankDetails().ready,
      rsvp: storage === 'redis' ? 'luu-duoc' : 'chi-khi-chay-may',
    })
  } catch (error) {
    const missing = error instanceof PlatformError && error.status === 503
    return NextResponse.json(
      { storage: 'thieu-redis', media: mediaStatus(), paymentsReady: bankDetails().ready, rsvp: 'khong-luu' },
      { status: missing ? 503 : 500 },
    )
  }
}
