import type { Metadata } from 'next'
import { RecoveryForm } from '@/components/studio/recovery-form'

export const metadata: Metadata = {
  title: 'Khôi phục mật khẩu',
  robots: { index: false, follow: false },
}

export default function RecoveryPage() {
  return <RecoveryForm />
}
