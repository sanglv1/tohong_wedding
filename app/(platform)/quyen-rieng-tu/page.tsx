import type { Metadata } from 'next'
import { SiteChrome } from '@/components/platform/site-chrome'

export const metadata: Metadata = { title: 'Quyền riêng tư' }

export default function PrivacyPage() {
  return (
    <SiteChrome>
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-stone-700">
      <h1 className="font-invite text-5xl text-stone-950">Quyền riêng tư</h1>
      <p className="mt-6">Tài khoản lưu tên, email và mật khẩu đã băm. Đăng nhập bằng Facebook thì lưu thêm mã Facebook của ứng dụng này. Thiệp lưu nội dung bạn viết, ảnh và nhạc bạn tải lên.</p>
      <p className="mt-4">Khi khách xác nhận tham dự, Tơ Hồng lưu tên, số điện thoại, số người và ghi chú để chủ thiệp chuẩn bị. Lời chúc lưu tên và nội dung lời chúc. Những dữ liệu này chỉ chủ thiệp và quản trị nền tảng đọc được.</p>
      <p className="mt-4">Email của chủ thiệp dùng để báo khi có khách xác nhận, nếu máy chủ đã cấu hình gửi thư. Không bán danh sách khách.</p>
        <p className="mt-4">Sau khi thiệp khép, dữ liệu vẫn được giữ để chủ thiệp xem lại. Muốn xóa thiệp hoặc tài khoản, viết qua trang liên hệ.</p>
      </article>
    </SiteChrome>
  )
}
