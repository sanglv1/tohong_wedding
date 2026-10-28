'use client'

import { useEffect, useState } from 'react'
import { money, type Order, type Ticket } from '@/lib/platform/commerce'

const LABEL = { cho: 'Chờ tiền', 'da-tra': 'Đã trả', hoan: 'Đã hoàn' }

export function AdminDesk({ storage }: { storage: 'redis' | 'file' }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [error, setError] = useState('')

  async function load() {
    const [orderRes, ticketRes] = await Promise.all([
      fetch('/api/orders?tat-ca=1', { cache: 'no-store' }),
      fetch('/api/ho-tro', { cache: 'no-store' }),
    ])
    const orderData = (await orderRes.json()) as { orders?: Order[]; error?: string }
    const ticketData = (await ticketRes.json()) as { tickets?: Ticket[]; error?: string }
    if (!orderRes.ok) throw new Error(orderData.error ?? 'Không đọc được đơn')
    if (!ticketRes.ok) throw new Error(ticketData.error ?? 'Không đọc được hỗ trợ')
    setOrders(orderData.orders ?? [])
    setTickets(ticketData.tickets ?? [])
  }

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Không tải được'))
  }, [])

  async function act(id: string, action: 'xac-nhan' | 'hoan') {
    setError('')
    const res = await fetch(`/api/orders/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setError(data.error ?? 'Không cập nhật được')
      return
    }
    await load()
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-8">
      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="font-invite text-3xl">Máy chủ</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {storage === 'redis'
            ? 'Đang lưu trên Redis. Xác nhận tham dự và sổ lưu bút ghi được trên bản bán.'
            : 'Đang lưu file trên máy này. Bản bán trên Vercel phải gắn Upstash Redis, nếu không khách xác nhận sẽ không được lưu.'}
        </p>
      </section>
      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="font-invite text-3xl">Đơn hàng</h2>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <ul className="mt-4 space-y-3 text-sm">
          {orders.length === 0 && <li className="text-stone-500">Chưa có đơn.</li>}
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-stone-200 p-3">
              <p className="font-medium">{order.code} · {money(order.amount)} · {LABEL[order.status]}</p>
              <p className="text-stone-500">{order.plan === 'studio' ? 'Studio' : 'Một thiệp'} · {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
              {order.payment?.transactionNo && <p className="text-stone-500">VNPAY {order.payment.transactionNo}</p>}
              <div className="mt-2 flex gap-3">
                {order.status === 'cho' && (
                  <button type="button" className="underline" onClick={() => void act(order.id, 'xac-nhan')}>Xác nhận đã nhận tiền</button>
                )}
                {order.status === 'da-tra' && (
                  <button type="button" className="text-red-700" onClick={() => void act(order.id, 'hoan')}>Hoàn tiền</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="font-invite text-3xl">Hỗ trợ</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {tickets.length === 0 && <li className="text-stone-500">Chưa có yêu cầu.</li>}
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-2xl border border-stone-200 p-3">
              <p className="font-medium">{ticket.name} · {ticket.contact}</p>
              <p className="mt-1 whitespace-pre-wrap text-stone-600">{ticket.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
