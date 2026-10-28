import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { VnpayCheckout } from '@/components/platform/vnpay-checkout'
import { bankDetails, money, planById } from '@/lib/platform/commerce'
import { getOrder } from '@/lib/platform/ledger'
import { getSessionUser } from '@/lib/platform/session'
import { vnpayKeysPresent, vnpayResultText } from '@/lib/platform/vnpay'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Đơn thanh toán',
  robots: { index: false, follow: false },
}

const STATUS = { cho: 'Chờ thanh toán', 'da-tra': 'Đã thanh toán', hoan: 'Đã hoàn tiền' }

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ vnpay?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const user = await getSessionUser().catch(() => null)
  if (!user) {
    const back = `/don/${id}${query.vnpay ? `?vnpay=${query.vnpay}` : ''}`
    redirect(`/dang-nhap?next=${encodeURIComponent(back)}`)
  }
  const order = await getOrder(id).catch(() => null)
  if (!order || (order.userId !== user.id && user.role !== 'admin')) notFound()
  const plan = planById(order.plan)
  const bank = bankDetails()
  const vnpayReady = vnpayKeysPresent()
  const paidOnVnpay = order.status === 'da-tra' && Boolean(order.payment?.transactionNo || order.payment?.responseCode === '00')
  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">Hóa đơn</p>
      <h1 className="mt-3 font-invite text-5xl">{plan?.name}</h1>
      <p className="mt-2 text-sm text-stone-500">{STATUS[order.status]} · {money(order.amount)}</p>
      {query.vnpay === 'xong' && order.status === 'da-tra' && (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
          VNPAY đã xác nhận. Bạn xuất bản được thiệp.
        </p>
      )}
      {query.vnpay === 'chua' && order.status === 'cho' && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {vnpayResultText(order.payment?.responseCode)} Đơn vẫn chờ, bạn có thể thanh toán lại.
        </p>
      )}
      {query.vnpay === 'lech' && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Số tiền VNPAY gửi về không khớp đơn. Đơn chưa được ghi nhận.
        </p>
      )}
      {order.status === 'cho' && vnpayReady && <VnpayCheckout orderId={order.id} />}
      {order.status === 'cho' && !vnpayReady && (
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Cổng VNPAY chưa bật trên máy chủ. Hãy chuyển khoản đúng số tiền và đúng nội dung, rồi chờ quản trị xác nhận.
        </p>
      )}
      <dl className="mt-8 space-y-3 rounded-[1.4rem] bg-white p-5 text-sm ring-1 ring-stone-900/10">
        <div className="flex justify-between gap-4"><dt className="text-stone-500">Mã đơn</dt><dd>{order.code}</dd></div>
        {paidOnVnpay && (
          <div className="flex justify-between gap-4"><dt className="text-stone-500">VNPAY</dt><dd>{order.payment?.transactionNo || 'Đã xác nhận'}</dd></div>
        )}
        <div className="flex justify-between gap-4"><dt className="text-stone-500">Ngân hàng</dt><dd>{bank.bank}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-stone-500">Số tài khoản</dt><dd className="font-medium">{bank.number}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-stone-500">Chủ tài khoản</dt><dd>{bank.holder}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-stone-500">Nội dung chuyển</dt><dd className="font-medium">{order.code}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-stone-500">Số tiền</dt><dd>{money(order.amount)}</dd></div>
      </dl>
      {order.status === 'cho' && (
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {vnpayReady
            ? 'Nếu không thanh toán trên VNPAY, chuyển khoản đúng số tiền và đúng nội dung. Quản trị xác nhận thì bạn xuất bản được.'
            : 'Chuyển đúng số tiền và đúng nội dung. Khi tiền về, quản trị xác nhận thì bạn xuất bản được thiệp.'}
        </p>
      )}
      {!bank.ready && order.status === 'cho' && !vnpayReady && (
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Tài khoản nhận tiền chưa được cấu hình trên máy chủ. Đơn vẫn tạo được để quản trị xác nhận khi chạy thử.
        </p>
      )}
      {order.status === 'da-tra' && (
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Đơn đã thanh toán{paidOnVnpay ? ' qua VNPAY' : ''}{order.studioUntil ? `. Studio dùng đến ${new Date(order.studioUntil).toLocaleDateString('vi-VN')}` : ''}. Đây là biên lai của bạn.
        </p>
      )}
      <a href="/studio" className="mt-6 inline-flex min-h-11 items-center text-sm underline">Về thiệp của tôi</a>
    </div>
  )
}
