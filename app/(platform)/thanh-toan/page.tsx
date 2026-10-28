import type { Metadata } from 'next'
import { SiteChrome } from '@/components/platform/site-chrome'
import { money, PLANS } from '@/lib/platform/commerce'

export const metadata: Metadata = { title: 'Thanh toán' }

export default async function PaymentPolicyPage({ searchParams }: { searchParams: Promise<{ vnpay?: string }> }) {
  const query = await searchParams
  return (
    <SiteChrome>
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-stone-700">
        <h1 className="font-invite text-5xl text-stone-950">Thanh toán</h1>
        <p className="mt-6">Viết thiệp và xem thử không mất phí. Trả một lần khi xuất bản link cho khách, không thuê theo tháng.</p>
        {query.vnpay === 'chu-ky' && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
            Không xác nhận được chữ ký VNPAY. Đơn chưa đổi trạng thái.
          </p>
        )}
        {query.vnpay === 'khong-thay' && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
            Không thấy đơn tương ứng với giao dịch này.
          </p>
        )}
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {PLANS.map((plan) => (
            <li key={plan.id}>{plan.name}: {money(plan.price)}. {plan.text}</li>
          ))}
        </ul>
        <p className="mt-4">
          Trên trang đơn, bấm thanh toán qua VNPAY. Bạn chọn thẻ, QR hoặc ứng dụng ngân hàng trên cổng VNPAY.
          VNPAY gọi về máy chủ để xác nhận. Tiền khớp đơn thì thiệp xuất bản được ngay, không cần quản trị bấm nhận tiền.
        </p>
        <p className="mt-4">
          Nếu cổng chưa bật, Tơ Hồng nhận chuyển khoản. Trang đơn ghi ngân hàng, số tài khoản, số tiền và nội dung chuyển.
          Chuyển đúng nội dung thì quản trị xác nhận.
        </p>
        <p className="mt-4">Tiền mừng cưới của khách đi thẳng vào tài khoản hai bạn. Tơ Hồng không đứng giữa khoản đó.</p>
      </article>
    </SiteChrome>
  )
}
