import { getSessionUser } from '@/lib/platform/session'
import { BrandMark } from '@/components/platform/brand-mark'

const inkButton =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-[#4a1520] px-3.5 text-sm text-[#f8f1e7] transition hover:bg-[#3a1018] sm:px-4'
const ghostButton =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/70 px-3.5 text-sm text-stone-800 sm:px-4'

export async function SiteChrome({
  children,
  bubble = true,
}: {
  children: React.ReactNode
  bubble?: boolean
}) {
  let signedIn = false
  try {
    signedIn = Boolean(await getSessionUser())
  } catch {
    signedIn = false
  }
  return (
    <div className="invite-grain">
      <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-[#f3efe7]/88 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <a href="/" className="inline-flex items-center gap-2 font-invite text-[1.85rem] leading-none tracking-tight">
            <BrandMark className="h-[1.65rem] w-[1.65rem]" />
            Tơ Hồng
          </a>
          <nav className="hidden items-center gap-7 text-sm text-stone-600 md:flex" aria-label="Trang chủ">
            <a href="/#mau" className="hover:text-stone-900">Mẫu thiệp</a>
            <a href="/gia" className="hover:text-stone-900">Giá</a>
            <a href="/lien-he" className="hover:text-stone-900">Liên hệ</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {signedIn ? (
              <>
                <a href="/lien-he" className="px-1 text-sm text-stone-600 md:hidden">Liên hệ</a>
                <a href="/studio" className={inkButton}>Thiệp của tôi</a>
              </>
            ) : (
              <>
                <a href="/dang-nhap" className={ghostButton}>Đăng nhập</a>
                <a href="/dang-ky" className={inkButton}>Đăng ký</a>
              </>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-stone-900/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-3">
          <div>
            <p className="inline-flex items-center gap-2.5 font-invite text-3xl">
              <BrandMark className="h-8 w-8" />
              Tơ Hồng
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-stone-500">
              Thiệp cưới online. Chọn mẫu, điền lễ, gửi một link. Khách mở trên điện thoại, không cần cài ứng dụng.
            </p>
          </div>
          <nav aria-label="Khám phá" className="text-sm">
            <p className="text-[11px] tracking-[0.28em] text-[#8a5a3a] uppercase">Khám phá</p>
            <ul className="mt-3 space-y-2 text-stone-600">
              <li><a href="/#mau" className="hover:text-stone-900">Mẫu thiệp</a></li>
              <li><a href="/gia" className="hover:text-stone-900">Giá</a></li>
              <li><a href="/thiep/tien-dat-huyen-trang" className="hover:text-stone-900">Thiệp gốc</a></li>
            </ul>
          </nav>
          <nav aria-label="Hỗ trợ và pháp lý" className="text-sm">
            <p className="text-[11px] tracking-[0.28em] text-[#8a5a3a] uppercase">Hỗ trợ</p>
            <ul className="mt-3 space-y-2 text-stone-600">
              <li><a href="/lien-he" className="hover:text-stone-900">Liên hệ</a></li>
              <li><a href="/#hoi-dap" className="hover:text-stone-900">Câu hỏi thường gặp</a></li>
              <li><a href="/dieu-khoan" className="hover:text-stone-900">Điều khoản</a></li>
              <li><a href="/quyen-rieng-tu" className="hover:text-stone-900">Quyền riêng tư</a></li>
              <li><a href="/thanh-toan" className="hover:text-stone-900">Thanh toán</a></li>
              <li><a href="/hoan-tien" className="hover:text-stone-900">Hoàn tiền</a></li>
            </ul>
          </nav>
        </div>
        <p className="border-t border-stone-900/10 px-5 py-4 text-center text-xs text-stone-400">© 2026 Tơ Hồng · SangLV</p>
      </footer>
      {bubble && (
        <a href="/lien-he" className="fixed right-4 bottom-4 z-30 inline-flex min-h-11 items-center rounded-full bg-[#4a1520] px-4 text-sm text-[#f8f1e7] shadow-lg">
          Liên hệ
        </a>
      )}
    </div>
  )
}
