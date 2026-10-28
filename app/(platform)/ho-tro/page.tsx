import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Hỗ trợ' }

export default function SupportPage() {
  redirect('/lien-he')
}
