import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GuestDesk } from '@/components/studio/guest-desk'
import { CONTENT } from '@/lib/content'
import { getSessionUser } from '@/lib/platform/session'
import { CLASSIC_SLUG } from '@/lib/platform/templates'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Thiệp gốc',
  robots: { index: false, follow: false },
}

export default async function ClassicDeskPage() {
  const user = await getSessionUser()
  if (!user) redirect('/dang-nhap?next=/studio/goc')
  if (user.role !== 'admin') redirect('/studio')

  const groom = CONTENT.couple.groomShort || CONTENT.couple.groom
  const bride = CONTENT.couple.brideShort || CONTENT.couple.bride

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href="/studio" className="text-sm text-stone-600">
        ← Danh sách
      </a>
      <h1 className="mt-4 font-invite text-4xl">
        {groom} & {bride}
      </h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Thiệp gốc. Khách, xác nhận và lời chúc nằm cùng chỗ với các thiệp khác. Nội dung chữ và ảnh của thiệp này vẫn sửa ở trang quản trị khi chạy trên máy.
      </p>
      <a href={`/thiep/${CLASSIC_SLUG}`} target="_blank" className="mt-4 inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm">
        Mở thiệp
      </a>
      <GuestDesk
        invitationId="classic"
        endpoint="/api/studio/classic/khach"
        slug={CLASSIC_SLUG}
        groom={groom}
        bride={bride}
        when={CONTENT.event.start.replace('T', ' ')}
        published
      />
    </div>
  )
}
