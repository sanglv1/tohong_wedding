'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Menu, X } from 'lucide-react'
import { WEDDING } from '@/lib/constants'

const NAV_LINKS = [
  { href: '#cau-chuyen', label: 'Câu chuyện' },
  { href: '#gia-dinh', label: 'Gia đình' },
  { href: '#lich-trinh', label: 'Lịch trình' },
  { href: '#khoanh-khac', label: 'Khoảnh khắc' },
  { href: '#xac-nhan', label: 'Xác nhận' },
  { href: '#loi-chuc', label: 'Lời chúc' },
  { href: '#hop-mung', label: 'Hộp mừng' },
]

/** Theo dõi phần đang nằm giữa màn hình để tô sáng mục menu tương ứng */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.href.slice(1))).filter(
      (el): el is HTMLElement => el !== null,
    )
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((el) => observer.observe(el))

    const onScroll = () => {
      if (window.scrollY < window.innerHeight * 0.4) setActive(null)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return active
}

export function WeddingHeader({
  showGuestbook = false,
  groomBrand = WEDDING.groomBrand,
  brideBrand = WEDDING.brideBrand,
  groomShort = WEDDING.groomShort,
  brideShort = WEDDING.brideShort,
}: {
  showGuestbook?: boolean
  groomBrand?: string
  brideBrand?: string
  groomShort?: string
  brideShort?: string
}) {
  const links = showGuestbook ? NAV_LINKS : NAV_LINKS.filter((l) => l.href !== '#loi-chuc')
  const [open, setOpen] = useState(false)
  const activeHref = useActiveSection()
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <header
      ref={headerRef}
      className="theme-header fixed top-[var(--demo-bar)] left-0 right-0 z-50 backdrop-blur-xl border-b shadow-sm pt-[env(safe-area-inset-top)]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <a
          href="#"
          className="font-serif text-xl sm:text-2xl font-semibold tracking-wide truncate max-w-[60vw] sm:max-w-none flex items-center flex-nowrap gap-x-1.5"
          aria-label={`${groomShort} và ${brideShort} - về đầu trang`}
        >
          <span className="whitespace-nowrap">{groomBrand}</span>
          <Heart className="w-4 h-4 text-w-gold fill-current" aria-hidden />
          <span className="whitespace-nowrap">{brideBrand}</span>
        </a>

        <nav className="hidden md:flex items-center gap-6" aria-label="Điều hướng chính">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-sm font-medium"
              aria-current={activeHref === link.href ? 'location' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          className="theme-header-btn md:hidden p-3 -mr-2 -my-2 rounded-lg transition-colors touch-manipulation"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
        </button>
      </div>

      <span className="scroll-progress" aria-hidden />

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Điều hướng"
          className="theme-header-mobile md:hidden absolute top-full left-0 right-0 border-b py-2 px-4 shadow-lg max-h-[70vh] overflow-y-auto"
        >
          <div className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="theme-header-btn mobile-nav-link py-3 px-2 font-medium rounded-lg transition-colors touch-manipulation"
                aria-current={activeHref === link.href ? 'location' : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
