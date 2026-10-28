'use client'

import { useState } from 'react'

export function VnpayCheckout({ orderId }: { orderId: string }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function pay() {
    setPending(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}/vnpay`, { method: 'POST' })
      const data = (await res.json()) as { error?: string; url?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Không tạo được phiên thanh toán')
      window.location.assign(data.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được phiên thanh toán')
      setPending(false)
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void pay()}
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#4a1520] px-5 text-sm text-[#f8f1e7] disabled:opacity-60"
      >
        {pending ? 'Đang chuyển sang VNPAY…' : 'Thanh toán qua VNPAY'}
      </button>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Bạn sang trang VNPAY để chọn thẻ, QR hoặc ứng dụng ngân hàng. Phiên giữ 15 phút. Tiền về thì thiệp xuất bản được ngay.
      </p>
    </div>
  )
}
