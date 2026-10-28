import { NextResponse } from 'next/server'
import type { WeddingContent } from '@/lib/content'
import { platformJson } from '@/lib/platform/http'
import type { SaveMode } from '@/lib/platform/save-plan'
import { getSessionUser } from '@/lib/platform/session'
import { deleteOwnedInvitation, saveOwnedInvitation } from '@/lib/platform/store'
import type { TemplateId } from '@/lib/platform/templates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { id: string }

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const { id } = await context.params
    const raw = await request.text()
    if (raw.length > 200_000) return NextResponse.json({ error: 'Nội dung thiệp quá lớn' }, { status: 413 })
    const body = JSON.parse(raw) as {
      mode?: unknown
      baseRevision?: unknown
      slug?: unknown
      templateId?: unknown
      content?: WeddingContent
    }
    if (body.mode !== 'draft' && body.mode !== 'publish' && body.mode !== 'unpublish') {
      return NextResponse.json({ error: 'Thao tác không hợp lệ' }, { status: 400 })
    }
    if (!body.content || typeof body.content !== 'object') {
      return NextResponse.json({ error: 'Thiếu nội dung thiệp' }, { status: 400 })
    }
    const invitation = await saveOwnedInvitation(user.id, id, {
      mode: body.mode as SaveMode,
      baseRevision: typeof body.baseRevision === 'number' ? body.baseRevision : -1,
      slug: typeof body.slug === 'string' ? body.slug : '',
      templateId: body.templateId as TemplateId,
      content: body.content,
    })
    return NextResponse.json({ invitation })
  } catch (error) {
    return platformJson(error, 'Không lưu được thiệp')
  }
}

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const { id } = await context.params
    await deleteOwnedInvitation(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return platformJson(error, 'Không xóa được thiệp')
  }
}
