import type { WeddingContent } from '@/lib/content'
import type { TemplateId } from './templates'
import type { InvitationRecord } from './types'

export type SaveMode = 'draft' | 'publish' | 'unpublish'

export type InvitationDraft = {
  slug: string
  templateId: TemplateId
  content: WeddingContent
}

/** Bản khách đang xem. Thiệp cũ không có ảnh chụp riêng thì dùng chính nội dung đã lưu. */
export function publicContent(invite: InvitationRecord): WeddingContent {
  return invite.publishedContent ?? invite.content
}

export function publicTemplate(invite: InvitationRecord): TemplateId {
  return invite.publishedTemplateId ?? invite.templateId
}

export function editableSlug(invite: InvitationRecord) {
  return invite.pendingSlug || invite.slug
}

/**
 * Tính bản ghi tiếp theo.
 * Lưu nháp không đổi cờ xuất bản và không đổi nội dung khách đang xem.
 */
export function planInvitationWrite(previous: InvitationRecord, input: InvitationDraft & { mode: SaveMode }, now: string): InvitationRecord {
  const next: InvitationRecord = {
    id: previous.id,
    ownerId: previous.ownerId,
    slug: previous.slug,
    templateId: input.templateId,
    published: previous.published,
    content: structuredClone(input.content),
    updatedAt: now,
    revision: previous.revision + 1,
    publishedContent: previous.publishedContent ? structuredClone(previous.publishedContent) : undefined,
    publishedTemplateId: previous.publishedTemplateId,
    pendingSlug: previous.pendingSlug,
  }

  if (input.mode === 'draft') {
    if (previous.published) {
      if (!next.publishedContent) {
        next.publishedContent = structuredClone(previous.content)
        next.publishedTemplateId = previous.publishedTemplateId ?? previous.templateId
      }
      next.slug = previous.slug
      if (input.slug !== previous.slug) next.pendingSlug = input.slug
      else delete next.pendingSlug
      return next
    }
    next.slug = input.slug
    delete next.pendingSlug
    return next
  }

  if (input.mode === 'publish') {
    next.published = true
    next.slug = input.slug
    next.publishedContent = structuredClone(input.content)
    next.publishedTemplateId = input.templateId
    delete next.pendingSlug
    return next
  }

  next.published = false
  next.slug = input.slug
  delete next.pendingSlug
  return next
}

export function planCopy(source: InvitationRecord, id: string, slug: string, now: string): InvitationRecord {
  return {
    id,
    ownerId: source.ownerId,
    slug,
    templateId: source.templateId,
    published: false,
    content: structuredClone(source.content),
    updatedAt: now,
    revision: 1,
  }
}

export function sameDraft(invite: InvitationRecord, draft: InvitationDraft) {
  return (
    editableSlug(invite) === draft.slug &&
    invite.templateId === draft.templateId &&
    JSON.stringify(invite.content) === JSON.stringify(draft.content)
  )
}

/** Bản trên server đã lệch so với nội dung khách đang xem. */
export function publishedIsBehind(invite: InvitationRecord) {
  if (!invite.published) return false
  return draftDiffersFromPublic(invite, {
    slug: editableSlug(invite),
    templateId: invite.templateId,
    content: invite.content,
  })
}

/** Khách vẫn đang xem bản cũ dù bản nháp đã được lưu. */
export function draftDiffersFromPublic(invite: InvitationRecord, draft: InvitationDraft) {
  if (!invite.published) return false
  return (
    draft.slug !== invite.slug ||
    draft.templateId !== publicTemplate(invite) ||
    JSON.stringify(draft.content) !== JSON.stringify(publicContent(invite))
  )
}
