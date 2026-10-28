import { NextResponse } from 'next/server'
import { platformJson } from '@/lib/platform/http'
import { getSessionUser } from '@/lib/platform/session'
import { copyOwnedInvitation, summarizeInvite } from '@/lib/platform/store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { id: string }

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Hãy đăng nhập' }, { status: 401 })
    const { id } = await context.params
    const invitation = await copyOwnedInvitation(user.id, id)
    return NextResponse.json({ invitation: summarizeInvite(invitation) })
  } catch (error) {
    return platformJson(error, 'Không sao chép được thiệp')
  }
}
