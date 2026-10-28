import type { Metadata } from 'next'
import { SiteChrome } from '@/components/platform/site-chrome'

export const metadata: Metadata = { title: 'Điều khoản' }

export default function TermsPage() {
  return (
    <SiteChrome>
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-stone-700">
      <h1 className="font-invite text-5xl text-stone-950">Điều khoản</h1>
      <p className="mt-6">Tơ Hồng là nơi viết và xuất bản thiệp cưới. Bạn giữ quyền với tên, ảnh và chữ của mình. Tơ Hồng được lưu và hiển thị nội dung đó để khách mở thiệp.</p>
      <p className="mt-4">Viết và xem thử không mất phí. Xuất bản link công khai cần thanh toán đúng gói. Gói Một thiệp mở một thiệp đến 45 ngày sau giờ kết thúc lễ, rồi thiệp khép: khách vẫn đọc được, nhưng không gửi thêm xác nhận hay lời chúc. Gói Studio mở tối đa 30 thiệp trong 30 ngày kể từ lúc tiền được xác nhận.</p>
      <p className="mt-4">Hoàn tiền khi thiệp chưa xuất bản. Thiệp đã gửi khách thì cần gỡ xuất bản trước khi hoàn. Chuyển khoản sai nội dung có thể chậm xác nhận.</p>
        <p className="mt-4">Không dùng thiệp để lừa đảo, gửi nội dung trái pháp luật, hoặc mạo danh người khác. Tơ Hồng được gỡ thiệp đó và khóa tài khoản.</p>
      </article>
    </SiteChrome>
  )
}
