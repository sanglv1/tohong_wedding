import { NextResponse } from 'next/server'
import { PlatformError, logPlatformFailure } from '@/lib/platform/errors'
import { readMedia } from '@/lib/platform/media'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { id: string }

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params
    const user = await getSessionUser()
    const media = await readMedia(id, user)
    if (!media) return new NextResponse('Không thấy ảnh', { status: 404 })
    return new NextResponse(new Uint8Array(media.bytes), {
      headers: {
        'Content-Type': media.type,
        'Cache-Control': media.isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof PlatformError) return new NextResponse(error.message, { status: error.status })
    logPlatformFailure(error)
    return new NextResponse('Không đọc được ảnh', { status: 502 })
  }
}
