import { NextResponse } from 'next/server'
import { platformJson } from '@/lib/platform/http'
import { invitationForOwner } from '@/lib/platform/invite-access'
import { writePreview } from '@/lib/platform/preview'
import { isTemplateId } from '@/lib/platform/templates'
import type { WeddingContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params
    const invite = await invitationForOwner(id)
    const body = (await request.json()) as { templateId?: unknown; content?: WeddingContent }
    if (!isTemplateId(body.templateId) || !body.content || typeof body.content !== 'object') {
      return NextResponse.json({ error: 'Bản xem trước chưa đủ' }, { status: 400 })
    }
    await writePreview(invite.id, { ownerId: invite.ownerId, templateId: body.templateId, content: body.content })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return platformJson(error, 'Không cập nhật được bản xem trước')
  }
}
