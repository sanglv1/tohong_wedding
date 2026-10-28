import type { WeddingContent } from '@/lib/content'
import type { TemplateId } from './templates'

export type Role = 'admin' | 'member'

export type PlatformUser = {
  id: string
  username: string
  passwordHash: string
  name: string
  role: Role
  createdAt: string
  /** Mã khôi phục đã băm. Không có nghĩa tài khoản tạo trước khi có mục này. */
  recoveryHash?: string
  email?: string
  /** Mã người dùng do Facebook cấp cho ứng dụng này. */
  facebookId?: string
}

export type PublicUser = Omit<PlatformUser, 'passwordHash'>

export type InvitationRecord = {
  id: string
  ownerId: string
  slug: string
  templateId: TemplateId
  published: boolean
  content: WeddingContent
  updatedAt: string
  /** Số lần ghi thành công. Thiệp cũ không có trường này thì coi là 0. */
  revision: number
  /** Nội dung khách đang xem. Thiệp cũ đã xuất bản dùng `content` khi trường này vắng. */
  publishedContent?: WeddingContent
  publishedTemplateId?: TemplateId
  /** Đường dẫn mới, chỉ áp dụng khi xuất bản lại. */
  pendingSlug?: string
}

export type InvitationSummary = {
  id: string
  slug: string
  pendingSlug?: string
  templateId: TemplateId
  /** Mẫu khách đang xem, nếu thiệp đã xuất bản. */
  publishedTemplateId?: TemplateId
  published: boolean
  updatedAt: string
  groom: string
  bride: string
  revision: number
}

export type AdminInvitationRef = {
  slug: string
  published: boolean
  templateId: TemplateId
}

export type AdminUserRow = PublicUser & {
  invitations: AdminInvitationRef[]
}
