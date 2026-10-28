import { NextResponse } from 'next/server'
import { platformJson } from '@/lib/platform/http'
import { getSessionUser } from '@/lib/platform/session'
import { createInvitation, summarizeInvite } from '@/lib/platform/store'
import { isTemplateId } from '@/lib/platform/templates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const body = (await request.json()) as { templateId?: unknown }
    if (!isTemplateId(body.templateId)) return NextResponse.json({ error: 'Mẫu thiệp không hợp lệ' }, { status: 400 })
    const invitation = await createInvitation(user.id, body.templateId)
    return NextResponse.json({ invitation: summarizeInvite(invitation) })
  } catch (error) {
    return platformJson(error, 'Không tạo được thiệp')
  }
}
