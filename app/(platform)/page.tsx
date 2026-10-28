import type { Metadata } from 'next'
import { PlatformHome } from '@/components/platform/home'
import { getSessionUser } from '@/lib/platform/session'

export const metadata: Metadata = {
  title: 'Tơ Hồng — Thiệp cưới online',
  description: 'Nền tảng thiệp cưới: chọn mẫu, viết lễ, gửi một link để khách xác nhận, chúc và mừng cưới.',
}

export default async function HomePage() {
  let signedIn = false
  try {
    signedIn = Boolean(await getSessionUser())
  } catch {
    signedIn = false
  }
  return <PlatformHome signedIn={signedIn} />
}
