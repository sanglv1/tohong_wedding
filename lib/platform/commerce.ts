import type { Role } from './types'

export const KEEP_DAYS = 45
export const STUDIO_DAYS = 30
export const FREE_DRAFTS = 3
export const STUDIO_DRAFTS = 30

export const PLANS = [
  {
    id: 'mot-thiep',
    name: 'Một thiệp',
    price: 150_000,
    text: 'Xuất bản một thiệp. Link mở tới 45 ngày sau lễ, rồi thiệp khép lại và không nhận thêm xác nhận.',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 990_000,
    text: '30 ngày, tối đa 30 thiệp. Dành cho người làm thiệp cho nhiều cặp đôi. Hết hạn thì thiệp đã xuất bản vẫn mở đến sau lễ.',
  },
] as const

export type PlanId = (typeof PLANS)[number]['id']
export type OrderStatus = 'cho' | 'da-tra' | 'hoan'

/** Một lần mở cổng VNPAY cho đơn. `attempts` giữ mọi mã giao dịch để IPN muộn vẫn khớp. */
export type VnpayPayment = {
  provider: 'vnpay'
  txnRef: string
  attempts: string[]
  transactionNo?: string
  responseCode?: string
  bankCode?: string
  payDate?: string
  cardType?: string
}

export type Order = {
  id: string
  userId: string
  plan: PlanId
  invitationId: string | null
  amount: number
  code: string
  status: OrderStatus
  createdAt: string
  paidAt?: string
  refundedAt?: string
  studioUntil?: string
  payment?: VnpayPayment
}

export type Ticket = {
  id: string
  userId: string | null
  name: string
  contact: string
  message: string
  createdAt: string
}

export type Notice = {
  id: string
  userId: string
  title: string
  body: string
  href: string
  createdAt: string
  read: boolean
}

export function planById(id: string) {
  return PLANS.find((plan) => plan.id === id) ?? null
}

export function money(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`
}

export function transferCode(id: string) {
  return `TOHONG ${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

export function bankDetails() {
  const number = process.env.PAYMENT_ACCOUNT_NUMBER?.trim() ?? ''
  return {
    bank: process.env.PAYMENT_BANK_NAME?.trim() || 'Ngân hàng nhận tiền',
    number: number || 'Chưa cấu hình',
    holder: process.env.PAYMENT_ACCOUNT_NAME?.trim() || 'Tơ Hồng',
    ready: Boolean(number),
  }
}

export function activeStudio(orders: Order[], userId: string, now = Date.now()) {
  return orders.some(
    (order) =>
      order.userId === userId &&
      order.plan === 'studio' &&
      order.status === 'da-tra' &&
      Boolean(order.studioUntil) &&
      Date.parse(order.studioUntil ?? '') > now,
  )
}

export function invitationPaid(orders: Order[], userId: string, invitationId: string) {
  return orders.some(
    (order) =>
      order.userId === userId &&
      order.plan === 'mot-thiep' &&
      order.status === 'da-tra' &&
      order.invitationId === invitationId,
  )
}

/** Lần xuất bản đầu cần đã trả. Thiệp đã xuất bản được cập nhật tiếp. Quản trị không bị chặn. */
export function canPublishFor(orders: Order[], role: Role, userId: string, invitationId: string, alreadyPublished: boolean, now = Date.now()) {
  if (role === 'admin' || alreadyPublished) return true
  return activeStudio(orders, userId, now) || invitationPaid(orders, userId, invitationId)
}

export function draftLimit(orders: Order[], userId: string, role: Role, now = Date.now()) {
  if (role === 'admin' || activeStudio(orders, userId, now)) return STUDIO_DRAFTS
  return FREE_DRAFTS
}

export function isArchived(endIso: string, now = Date.now()) {
  const end = Date.parse(endIso)
  if (!endIso || Number.isNaN(end)) return false
  return now > end + KEEP_DAYS * 24 * 60 * 60 * 1000
}

export function openOrder(orders: Order[], userId: string, plan: PlanId, invitationId: string | null) {
  return (
    orders.find(
      (order) =>
        order.userId === userId &&
        order.status === 'cho' &&
        order.plan === plan &&
        order.invitationId === invitationId,
    ) ?? null
  )
}
