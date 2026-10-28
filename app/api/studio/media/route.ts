import { NextResponse } from 'next/server'
import { platformJson } from '@/lib/platform/http'
import { MAX_IMAGE_BYTES, saveAudio, saveMedia } from '@/lib/platform/media'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Ảnh quá lớn' }, { status: 413 })
    }

    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Chưa chọn file' }, { status: 400 })
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'File quá 4 MB' }, { status: 413 })

    const bytes = Buffer.from(await file.arrayBuffer())
    const url = form.get('kind') === 'audio' ? await saveAudio(user.id, bytes) : await saveMedia(user.id, bytes)
    return NextResponse.json({ url })
  } catch (error) {
    return platformJson(error, 'Không tải được ảnh')
  }
}
