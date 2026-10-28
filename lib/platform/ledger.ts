import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { isRedisConfigured, pipeline } from '@/lib/redis'
import type { Notice, Order, OrderStatus, PlanId, Ticket, VnpayPayment } from './commerce'
import { planById, STUDIO_DAYS, transferCode } from './commerce'
import { PlatformError } from './errors'
import { storageKind } from './storage-mode'

type Ledger = { orders: Order[]; tickets: Ticket[]; notices: Notice[] }

const file = join(process.cwd(), 'data', 'ledger.json')
const ORDER_IDS = 'platform:ledger:order-ids'
const TICKET_IDS = 'platform:ledger:ticket-ids'
const orderKey = (id: string) => `platform:ledger:order:${id}`
const ticketKey = (id: string) => `platform:ledger:ticket:${id}`
const noticeKey = (id: string) => `platform:ledger:notice:${id}`
const noticesKey = (userId: string) => `platform:ledger:notices:${userId}`

let queue: Promise<void> = Promise.resolve()

function locked<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function kind() {
  return storageKind({
    redis: isRedisConfigured,
    production: process.env.NODE_ENV === 'production',
    vercel: process.env.VERCEL === '1',
  })
}

function asOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== 'object') return null
  const order = raw as Order
  if (typeof order.id !== 'string' || typeof order.userId !== 'string' || !planById(order.plan)) return null
  if (order.status !== 'cho' && order.status !== 'da-tra' && order.status !== 'hoan') return null
  if (typeof order.amount !== 'number' || typeof order.code !== 'string') return null
  const payment = asPayment((raw as { payment?: unknown }).payment)
  if (payment) order.payment = payment
  else delete order.payment
  return order
}

function asText(value: unknown, max: number) {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (!text) return undefined
  return text.slice(0, max)
}

function asPayment(raw: unknown): VnpayPayment | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const payment = raw as Partial<VnpayPayment>
  if (payment.provider !== 'vnpay' || typeof payment.txnRef !== 'string' || !payment.txnRef) return undefined
  const attempts = Array.isArray(payment.attempts)
    ? payment.attempts.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
  if (!attempts.includes(payment.txnRef)) attempts.push(payment.txnRef)
  return {
    provider: 'vnpay',
    txnRef: payment.txnRef,
    attempts,
    transactionNo: asText(payment.transactionNo, 40),
    responseCode: asText(payment.responseCode, 8),
    bankCode: asText(payment.bankCode, 20),
    payDate: asText(payment.payDate, 20),
    cardType: asText(payment.cardType, 20),
  }
}

function asTicket(raw: unknown): Ticket | null {
  if (!raw || typeof raw !== 'object') return null
  const ticket = raw as Ticket
  if (typeof ticket.id !== 'string' || typeof ticket.message !== 'string' || typeof ticket.contact !== 'string') return null
  return ticket
}

function asNotice(raw: unknown): Notice | null {
  if (!raw || typeof raw !== 'object') return null
  const notice = raw as Notice
  if (typeof notice.id !== 'string' || typeof notice.userId !== 'string' || typeof notice.title !== 'string') return null
  return notice
}

async function readFileLedger(): Promise<Ledger> {
  try {
    const data = JSON.parse(await readFile(file, 'utf8')) as Ledger
    return {
      orders: Array.isArray(data.orders) ? data.orders.map(asOrder).filter((item): item is Order => item !== null) : [],
      tickets: Array.isArray(data.tickets) ? data.tickets.map(asTicket).filter((item): item is Ticket => item !== null) : [],
      notices: Array.isArray(data.notices) ? data.notices.map(asNotice).filter((item): item is Notice => item !== null) : [],
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { orders: [], tickets: [], notices: [] }
    throw error
  }
}

async function writeFileLedger(data: Ledger) {
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function redisIds(key: string) {
  const [ids] = await pipeline([['SMEMBERS', key]])
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
}

async function redisOrders() {
  const ids = await redisIds(ORDER_IDS)
  if (!ids.length) return []
  const rows = await pipeline(ids.map((id) => ['GET', orderKey(id)]))
  return rows
    .map((row) => {
      if (typeof row !== 'string') return null
      try {
        return asOrder(JSON.parse(row))
      } catch {
        return null
      }
    })
    .filter((item): item is Order => item !== null)
}

export function listOrders(userId?: string) {
  return locked(async () => {
    const mode = kind()
    const orders = mode === 'file' ? (await readFileLedger()).orders : await redisOrders()
    const mine = userId ? orders.filter((order) => order.userId === userId) : orders
    return mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })
}

export function getOrder(id: string) {
  return locked(async () => {
    const mode = kind()
    if (mode === 'file') return (await readFileLedger()).orders.find((order) => order.id === id) ?? null
    const [raw] = await pipeline([['GET', orderKey(id)]])
    if (typeof raw !== 'string') return null
    try {
      return asOrder(JSON.parse(raw))
    } catch {
      return null
    }
  })
}

export function createOrder(input: { userId: string; plan: PlanId; invitationId: string | null }) {
  return locked(async () => {
    const mode = kind()
    const plan = planById(input.plan)
    if (!plan) throw new PlatformError('Gói không hợp lệ')
    if (input.plan === 'mot-thiep' && !input.invitationId) throw new PlatformError('Hãy chọn thiệp cần xuất bản')
    const existing = mode === 'file' ? (await readFileLedger()).orders : await redisOrders()
    const open = existing.find(
      (order) =>
        order.userId === input.userId &&
        order.status === 'cho' &&
        order.plan === input.plan &&
        order.invitationId === input.invitationId,
    )
    if (open) return open
    const id = randomUUID()
    const order: Order = {
      id,
      userId: input.userId,
      plan: input.plan,
      invitationId: input.plan === 'mot-thiep' ? input.invitationId : null,
      amount: plan.price,
      code: transferCode(id),
      status: 'cho',
      createdAt: new Date().toISOString(),
    }
    if (mode === 'file') {
      const data = await readFileLedger()
      data.orders.push(order)
      await writeFileLedger(data)
      return order
    }
    await pipeline([
      ['SET', orderKey(order.id), JSON.stringify(order)],
      ['SADD', ORDER_IDS, order.id],
    ])
    return order
  })
}

export function setOrderStatus(id: string, status: Extract<OrderStatus, 'da-tra' | 'hoan'>) {
  return locked(async () => {
    const mode = kind()
    const orders = mode === 'file' ? (await readFileLedger()).orders : await redisOrders()
    const order = orders.find((item) => item.id === id)
    if (!order) throw new PlatformError('Không thấy đơn', 404)
    if (order.status === 'hoan') throw new PlatformError('Đơn đã hoàn')
    if (status === 'hoan' && order.status !== 'da-tra') throw new PlatformError('Chỉ hoàn đơn đã thanh toán')
    if (status === 'da-tra' && order.status !== 'cho') throw new PlatformError('Đơn không còn chờ thanh toán')
    const now = new Date().toISOString()
    const next: Order = {
      ...order,
      status,
      paidAt: status === 'da-tra' ? now : order.paidAt,
      refundedAt: status === 'hoan' ? now : order.refundedAt,
      studioUntil:
        status === 'da-tra' && order.plan === 'studio'
          ? new Date(Date.now() + STUDIO_DAYS * 24 * 60 * 60 * 1000).toISOString()
          : status === 'hoan'
            ? undefined
            : order.studioUntil,
    }
    if (mode === 'file') {
      const data = await readFileLedger()
      data.orders = data.orders.map((item) => (item.id === id ? next : item))
      await writeFileLedger(data)
      return next
    }
    await pipeline([['SET', orderKey(id), JSON.stringify(next)]])
    return next
  })
}

export type VnpaySettlement = {
  txnRef: string
  amountMinor: number
  success: boolean
  responseCode: string
  transactionNo?: string
  bankCode?: string
  payDate?: string
  cardType?: string
}

export type VnpaySettleResult =
  | { kind: 'missing' }
  | { kind: 'amount' | 'already' | 'failed' | 'paid'; order: Order }

async function persistOrder(order: Order) {
  const mode = kind()
  if (mode === 'file') {
    const data = await readFileLedger()
    const index = data.orders.findIndex((item) => item.id === order.id)
    if (index === -1) data.orders.push(order)
    else data.orders[index] = order
    await writeFileLedger(data)
    return
  }
  await pipeline([['SET', orderKey(order.id), JSON.stringify(order)]])
}

function withVnpayDetails(order: Order, input: VnpaySettlement): Order {
  const current = order.payment
  const attempts = current?.attempts.includes(input.txnRef) ? current.attempts : [...(current?.attempts ?? []), input.txnRef]
  return {
    ...order,
    payment: {
      provider: 'vnpay',
      txnRef: current?.txnRef ?? input.txnRef,
      attempts,
      transactionNo: input.transactionNo || current?.transactionNo,
      responseCode: input.responseCode,
      bankCode: input.bankCode || current?.bankCode,
      payDate: input.payDate || current?.payDate,
      cardType: input.cardType || current?.cardType,
    },
  }
}

function markPaid(order: Order, now = new Date()): Order {
  return {
    ...order,
    status: 'da-tra',
    paidAt: order.paidAt ?? now.toISOString(),
    studioUntil:
      order.plan === 'studio'
        ? new Date(now.getTime() + STUDIO_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : order.studioUntil,
  }
}

/** Gắn một mã giao dịch mới trước khi chuyển khách sang VNPAY. */
export function attachVnpayAttempt(orderId: string, txnRef: string) {
  return locked(async () => {
    if (!/^[A-Za-z0-9]{1,100}$/.test(txnRef)) throw new PlatformError('Mã giao dịch không hợp lệ')
    const mode = kind()
    const orders = mode === 'file' ? (await readFileLedger()).orders : await redisOrders()
    if (orders.some((order) => order.payment?.attempts.includes(txnRef))) {
      throw new PlatformError('Mã giao dịch đã tồn tại')
    }
    const order = orders.find((item) => item.id === orderId)
    if (!order) throw new PlatformError('Không thấy đơn', 404)
    if (order.status !== 'cho') throw new PlatformError('Đơn không còn chờ thanh toán')
    const next: Order = {
      ...order,
      payment: {
        provider: 'vnpay',
        txnRef,
        attempts: [...(order.payment?.attempts ?? []), txnRef],
      },
    }
    await persistOrder(next)
    return next
  })
}

export type VnpayDecision =
  | { kind: 'missing' }
  | { kind: 'amount'; order: Order }
  | { kind: 'already'; order: Order; changed: boolean }
  | { kind: 'failed' | 'paid'; order: Order }

/**
 * Quyết định ghi sổ sau khi IPN đã qua kiểm tra chữ ký.
 * Sai số tiền không đổi đơn. Giao dịch lỗi giữ trạng thái chờ. Đơn đã trả hoặc đã hoàn không bị kéo lại.
 */
export function decideVnpaySettlement(order: Order | null, input: VnpaySettlement, now = new Date()): VnpayDecision {
  if (!order) return { kind: 'missing' }
  if (input.amountMinor !== order.amount * 100) return { kind: 'amount', order }
  if (order.status !== 'cho') {
    if (input.success && order.status === 'da-tra') return { kind: 'already', order: withVnpayDetails(order, input), changed: true }
    return { kind: 'already', order, changed: false }
  }
  if (!input.success) return { kind: 'failed', order: withVnpayDetails(order, input) }
  return { kind: 'paid', order: markPaid(withVnpayDetails(order, input), now) }
}

/**
 * Ghi nhận Return hoặc IPN đã kiểm chữ ký.
 * Thất bại giữ đơn ở trạng thái chờ để khách thanh toán lại.
 * Đơn đã trả hoặc đã hoàn thì không đổi trạng thái.
 */
export function settleVnpay(input: VnpaySettlement) {
  return locked(async () => {
    const mode = kind()
    const orders = mode === 'file' ? (await readFileLedger()).orders : await redisOrders()
    const order = orders.find((item) => item.payment?.attempts.includes(input.txnRef) || item.payment?.txnRef === input.txnRef) ?? null
    const decision = decideVnpaySettlement(order, input)
    if (decision.kind === 'missing') return { kind: 'missing' } satisfies VnpaySettleResult
    if (decision.kind === 'paid' || decision.kind === 'failed' || (decision.kind === 'already' && decision.changed)) {
      await persistOrder(decision.order)
    }
    return { kind: decision.kind, order: decision.order } satisfies VnpaySettleResult
  })
}

export function addTicket(input: { userId: string | null; name: string; contact: string; message: string }) {
  return locked(async () => {
    const mode = kind()
    const ticket: Ticket = {
      id: randomUUID(),
      userId: input.userId,
      name: input.name.slice(0, 80),
      contact: input.contact.slice(0, 120),
      message: input.message.slice(0, 2000),
      createdAt: new Date().toISOString(),
    }
    if (!ticket.name || !ticket.contact || ticket.message.length < 8) throw new PlatformError('Hãy điền tên, cách liên hệ và nội dung')
    if (mode === 'file') {
      const data = await readFileLedger()
      data.tickets.push(ticket)
      await writeFileLedger(data)
      return ticket
    }
    await pipeline([
      ['SET', ticketKey(ticket.id), JSON.stringify(ticket)],
      ['SADD', TICKET_IDS, ticket.id],
    ])
    return ticket
  })
}

export function listTickets() {
  return locked(async () => {
    const mode = kind()
    if (mode === 'file') {
      const data = await readFileLedger()
      return data.tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    const ids = await redisIds(TICKET_IDS)
    if (!ids.length) return []
    const rows = await pipeline(ids.map((id) => ['GET', ticketKey(id)]))
    return rows
      .map((row) => {
        if (typeof row !== 'string') return null
        try {
          return asTicket(JSON.parse(row))
        } catch {
          return null
        }
      })
      .filter((item): item is Ticket => item !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })
}

export function addNotice(input: { userId: string; title: string; body: string; href: string }) {
  return locked(async () => {
    const mode = kind()
    const notice: Notice = {
      id: randomUUID(),
      userId: input.userId,
      title: input.title.slice(0, 120),
      body: input.body.slice(0, 400),
      href: input.href.slice(0, 200),
      createdAt: new Date().toISOString(),
      read: false,
    }
    if (mode === 'file') {
      const data = await readFileLedger()
      data.notices.push(notice)
      await writeFileLedger(data)
      return notice
    }
    await pipeline([
      ['SET', noticeKey(notice.id), JSON.stringify(notice)],
      ['SADD', noticesKey(notice.userId), notice.id],
    ])
    return notice
  })
}

export function listNotices(userId: string) {
  return locked(async () => {
    const mode = kind()
    if (mode === 'file') {
      const data = await readFileLedger()
      return data.notices.filter((notice) => notice.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)
    }
    const ids = await redisIds(noticesKey(userId))
    if (!ids.length) return []
    const rows = await pipeline(ids.map((id) => ['GET', noticeKey(id)]))
    return rows
      .map((row) => {
        if (typeof row !== 'string') return null
        try {
          return asNotice(JSON.parse(row))
        } catch {
          return null
        }
      })
      .filter((item): item is Notice => item !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
  })
}
