import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WeddingSite } from '@/components/wedding-site'
import { sampleContent } from '@/lib/platform/content'
import { albumById, giftById, openingById, trackBySrc } from '@/lib/platform/experience'
import { isTemplateId, TEMPLATES, templateById } from '@/lib/platform/templates'

export const metadata: Metadata = {
  title: 'Xem mẫu thiệp',
  robots: { index: false, follow: false },
}

export default async function SamplePage({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params
  if (!isTemplateId(template) || !TEMPLATES.some((item) => item.id === template)) notFound()
  const shell = templateById(template)
  return (
    <>
      <style>{'html[data-theme]{--demo-bar:2.5rem}'}</style>
      <div className="fixed inset-x-0 top-0 z-[130] flex h-10 items-center justify-center bg-stone-900 px-3 text-center text-xs text-white sm:text-sm">
        <p className="min-w-0 truncate">
          Mẫu {shell.name}: mở {openingById(shell.opening).name}, album {albumById(shell.album).name}, hộp mừng {giftById(shell.gift).name}, nhạc {trackBySrc(shell.track)?.name ?? 'riêng'}. Xem thử, không lưu xác nhận.{' '}
          <a href={`/?mau=${shell.id}#mau`} className="underline">
            Dùng mẫu này
          </a>
        </p>
      </div>
      <WeddingSite content={sampleContent(shell.id)} templateId={shell.id} guestbook demo trackOpens={false} />
    </>
  )
}
