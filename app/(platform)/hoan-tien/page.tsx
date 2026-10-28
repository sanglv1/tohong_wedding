import type { Metadata } from 'next'
import { SiteChrome } from '@/components/platform/site-chrome'

export const metadata: Metadata = { title: 'Hoàn tiền' }

export default function RefundPolicyPage() {
  return (
    <SiteChrome>
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-stone-700">
        <h1 className="font-invite text-5xl text-stone-950">Hoàn tiền</h1>
        <p className="mt-6">Gói Một thiệp được hoàn khi thiệp đó chưa xuất bản. Thiệp đã gửi khách thì gỡ xuất bản trước, rồi quản trị hoàn trên bàn đơn.</p>
        <p className="mt-4">Chuyển sai nội dung, thanh toán nhầm trên VNPAY, hoặc cần hoàn gói Studio, viết qua trang liên hệ và kèm mã đơn trên hóa đơn. Quản trị ghi hoàn trên bàn đơn.</p>
      </article>
    </SiteChrome>
  )
}
