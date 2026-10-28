import { Cormorant_Garamond, Playfair_Display } from 'next/font/google'
import { PlatformBody } from '@/components/platform/platform-body'

const display = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-invite-display',
  display: 'swap',
})

const editorial = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-invite-editorial',
  display: 'swap',
})

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${editorial.variable} min-h-dvh bg-[#f3efe7] text-stone-900`}>
      <PlatformBody />
      {children}
    </div>
  )
}
