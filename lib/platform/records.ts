import { isTemplateId } from './templates'
import type { InvitationRecord } from './types'

export function revisionOf(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

export function parseInvite(raw: unknown): InvitationRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const invite = raw as InvitationRecord
  if (typeof invite.id !== 'string' || typeof invite.ownerId !== 'string' || typeof invite.slug !== 'string') return null
  if (typeof invite.published !== 'boolean' || !invite.content || typeof invite.content !== 'object') return null
  const pendingSlug = typeof invite.pendingSlug === 'string' && invite.pendingSlug && invite.pendingSlug !== invite.slug ? invite.pendingSlug : undefined
  const publishedContent =
    invite.publishedContent && typeof invite.publishedContent === 'object' ? invite.publishedContent : undefined
  return {
    id: invite.id,
    ownerId: invite.ownerId,
    slug: invite.slug,
    templateId: isTemplateId(invite.templateId) ? invite.templateId : 'nga-sang',
    published: invite.published,
    content: invite.content,
    updatedAt: typeof invite.updatedAt === 'string' ? invite.updatedAt : new Date(0).toISOString(),
    revision: revisionOf(invite.revision),
    publishedContent,
    publishedTemplateId: isTemplateId(invite.publishedTemplateId) ? invite.publishedTemplateId : undefined,
    pendingSlug,
  }
}
