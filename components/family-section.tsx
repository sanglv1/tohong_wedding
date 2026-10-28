import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { Reveal, type RevealVariant } from './reveal'
import { SectionHeading } from './section-heading'

function FamilyCard({
  title,
  ong,
  ba,
  delay,
  variant,
}: {
  title: string
  ong: string
  ba: string
  delay: number
  variant: RevealVariant
}) {
  return (
    <Reveal delay={delay} variant={variant} className="card-wedding rounded-2xl p-6 sm:p-8">
      <h3 className="text-3xl font-serif text-w-strong mb-6 text-center">{title}</h3>
      {/* Nhãn và tên xếp thành 2 cột để tên luôn thẳng hàng, cả khối căn giữa thẻ */}
      <dl className="mx-auto grid w-fit grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-3">
        <dt className="text-sm text-w-label">Ông:</dt>
        <dd className="text-lg font-medium text-w-text">{ong || '—'}</dd>
        <dt className="text-sm text-w-label">Bà:</dt>
        <dd className="text-lg font-medium text-w-text">{ba || '—'}</dd>
      </dl>
    </Reveal>
  )
}

export function FamilySection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const FAMILY_INFO = model.family
  const empty = !FAMILY_INFO.nhaTrai.ong && !FAMILY_INFO.nhaTrai.ba && !FAMILY_INFO.nhaGai.ong && !FAMILY_INFO.nhaGai.ba
  if (empty) return null
  return (
    <section id="gia-dinh" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="section-frame">
          <SectionHeading>Gia đình hai bên</SectionHeading>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <FamilyCard title="Nhà trai" ong={FAMILY_INFO.nhaTrai.ong} ba={FAMILY_INFO.nhaTrai.ba} delay={100} variant="left" />
            <FamilyCard title="Nhà gái" ong={FAMILY_INFO.nhaGai.ong} ba={FAMILY_INFO.nhaGai.ba} delay={200} variant="right" />
          </div>
        </div>
      </div>
    </section>
  )
}
