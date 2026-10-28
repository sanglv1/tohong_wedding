import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Great_Vibes } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from '@/lib/themes'
import './globals.css'

const bodyFont = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
  display: 'swap',
})
const scriptFont = Great_Vibes({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-script',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedding-trangdat.vercel.app'
const TITLE = 'Tơ Hồng — Thiệp cưới online'
const DESCRIPTION = 'Tơ Hồng là nền tảng thiệp cưới: bìa, lễ, album, xác nhận tham dự, sổ lưu bút và một link để gửi khách.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Tơ Hồng',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#420a10',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${scriptFont.variable}`}
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
