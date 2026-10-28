import { NextResponse } from 'next/server'
import { PlatformError } from './errors'
import { getSessionUser } from './session'
import { getInvitationBySlug, getOwnedInvitation } from './store'
import { CLASSIC_SLUG } from './templates'

export async function invitationForGuest(slug: string) {
  if (slug === CLASSIC_SLUG) return null
  const invite = await getInvitationBySlug(slug)
  if (!invite) return null
  if (invite.published) return invite
  try {
    const user = await getSessionUser()
    if (user?.id === invite.ownerId) return invite
  } catch {
    return null
  }
  return null
}

export async function invitationForOwner(id: string) {
  const user = await getSessionUser()
  if (!user) throw new PlatformError('Hãy đăng nhập', 401)
  const invite = await getOwnedInvitation(user.id, id)
  if (!invite) throw new PlatformError('Không thấy thiệp', 404)
  return invite
}

export function guestMiss() {
  return NextResponse.json({ error: 'Không thấy thiệp' }, { status: 404 })
}
