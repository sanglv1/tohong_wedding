import type { Metadata } from 'next'
import { SiteChrome } from '@/components/platform/site-chrome'
import { SupportForm } from '@/components/studio/support-form'
import { contactChannels } from '@/lib/platform/contact-channels'

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: 'Nhắn Tơ Hồng khi thiệp không mở, muốn hỏi giá, hoặc cần người xem cùng trước ngày cưới.',
}

export default function ContactPage() {
  const channels = contactChannels()
  return (
    <SiteChrome bubble={false}>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">Liên hệ</p>
        <h1 className="mt-3 font-invite text-5xl leading-none sm:text-6xl">Kết nối với Tơ Hồng</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600">
          Nhắn khi thiệp không mở, muốn hỏi giá, hoặc cần người xem cùng trước ngày cưới. Ngoài giờ thì để lại lời nhắn, sáng hôm sau có người đọc.
        </p>
        {channels.length > 0 && (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {channels.map((channel) => (
              <li key={channel.id}>
                <a href={channel.href} className="flex min-h-20 flex-col justify-center rounded-[1.3rem] bg-white px-5 py-4 ring-1 ring-stone-900/10 hover:ring-stone-900/25">
                  <span className="text-sm font-medium">{channel.label}</span>
                  <span className="mt-1 text-sm text-stone-500">{channel.value}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <section className="mt-8 rounded-[1.4rem] bg-white p-5 ring-1 ring-stone-900/10 sm:p-6">
          <h2 className="font-invite text-4xl">Để lại lời nhắn</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Ghi link thiệp và việc đang kẹt. Nếu đã đăng nhập, lời nhắn gắn với tài khoản của bạn.
          </p>
          <SupportForm embedded />
        </section>
        <p className="mt-8 text-sm leading-6 text-stone-600">
          Muốn tự làm thử: viết miễn phí, trả khi xuất bản link cho khách.{' '}
          <a href="/gia" className="underline">Xem giá</a>
          {' · '}
          <a href="/#mau" className="underline">Xem mẫu</a>
        </p>
      </div>
    </SiteChrome>
  )
}
