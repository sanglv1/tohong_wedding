import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegisterForm } from '@/components/studio/register-form'
import { facebookNotice } from '@/lib/platform/facebook'
import { getSessionUser } from '@/lib/platform/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tạo tài khoản',
  robots: { index: false, follow: false },
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  const user = await getSessionUser().catch(() => null)
  if (user) redirect('/studio')
  const notice = facebookNotice((await searchParams).loi)
  return <RegisterForm notice={notice} />
}
