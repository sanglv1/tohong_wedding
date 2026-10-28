'use client'

import { useMemo, useState } from 'react'
import { TemplatePoster, type PosterFace } from '@/components/templates'

export type CatalogCard = {
  id: string
  name: string
  mood: string
  blurb: string
  opening: string
  track: string
  album: string
  gift: string
  href: string
  studioHref: string
  face: PosterFace
}

const FILTERS: { id: string; label: string; moods: string[] | null }[] = [
  { id: 'all', label: 'Tất cả', moods: null },
  {
    id: 'moi',
    label: 'Mười mẫu mới',
    moods: ['Thư pháp', 'Đêm', 'Sân khấu', 'Retro', 'Cung đình', 'Sóng', 'Đêm hội', 'Báo', 'Nhật ký', 'Kiến trúc'],
  },
  { id: 'goc', label: 'Thiệp gốc', moods: ['Thiệp gốc'] },
  { id: 'truyen-thong', label: 'Truyền thống', moods: ['Truyền thống'] },
  { id: 'lang-man', label: 'Lãng mạn', moods: ['Lãng mạn', 'Lụa sáng'] },
  { id: 'co-dien', label: 'Cổ điển', moods: ['Cổ điển', 'Thư'] },
  { id: 'han', label: 'Hàn Quốc', moods: ['Hàn Quốc'] },
  { id: 'hien-dai', label: 'Hiện đại', moods: ['Hiện đại', 'Ảnh'] },
  { id: 'sang', label: 'Sang trọng', moods: ['Sang trọng', 'Trang nghiêm'] },
  { id: 'toi-gian', label: 'Tối giản', moods: ['Tối giản'] },
  { id: 'thao', label: 'Thảo mộc', moods: ['Thảo mộc', 'Thanh tịnh', 'Thanh'] },
  { id: 'am', label: 'Ấm', moods: ['Ấm áp', 'Ấm'] },
  { id: 'bien', label: 'Biển', moods: ['Khoáng đạt', 'Biển', 'Sóng'] },
  { id: 'dem', label: 'Đêm', moods: ['Đêm', 'Đêm hội'] },
  { id: 'thu-phap', label: 'Thư pháp', moods: ['Thư pháp', 'Cung đình'] },
  { id: 'san-khau', label: 'Sân khấu', moods: ['Sân khấu'] },
  { id: 'retro', label: 'Retro', moods: ['Retro', 'Báo'] },
  { id: 'nhat-ky', label: 'Nhật ký', moods: ['Nhật ký'] },
  { id: 'kien-truc', label: 'Kiến trúc', moods: ['Kiến trúc'] },
]

const useButton =
  'inline-flex min-h-9 w-full items-center justify-center rounded-full bg-[#4a1520] px-3 text-xs text-[#f8f1e7] transition hover:bg-[#3a1018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a1520]/50'

export function TemplateCatalog({ cards }: { cards: CatalogCard[] }) {
  const [filter, setFilter] = useState('all')
  const counts = useMemo(() => {
    const tally = new Map<string, number>()
    for (const item of FILTERS) {
      tally.set(item.id, item.moods ? cards.filter((card) => item.moods!.includes(card.mood)).length : cards.length)
    }
    return tally
  }, [cards])
  const active = FILTERS.find((item) => item.id === filter) ?? FILTERS[0]
  const shown = active.moods ? cards.filter((card) => active.moods!.includes(card.mood)) : cards

  return (
    <section id="mau" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">{shown.length} mẫu</p>
          <h2 className="mt-2 font-invite text-4xl sm:text-5xl">Chọn một cách mở đầu</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-stone-600">
          Mười mẫu mới mỗi mẫu một bố cục riêng. Kho nhạc MP3 đi cùng: đàn tranh, valse, sóng, đèn hội.
        </p>
      </div>

      <div className="sticky top-16 z-30 -mx-5 mt-5 border-y border-stone-900/10 bg-[#f3efe7] px-5 py-3">
        <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible" role="toolbar" aria-label="Lọc mẫu theo phong cách">
          {FILTERS.map((item) => {
            const count = counts.get(item.id) ?? 0
            if (count === 0) return null
            const on = item.id === active.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(item.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a1520]/40 ${
                  on ? 'border-[#4a1520] bg-[#4a1520] text-[#f8f1e7]' : 'border-stone-300 bg-white/80 text-stone-700 hover:border-stone-400'
                }`}
              >
                {item.label}
                <span className={on ? 'ml-1.5 text-[11px] text-[#f8f1e7]/75' : 'ml-1.5 text-[11px] text-stone-400'}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((card) => (
          <article key={card.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_36px_-28px_rgba(60,36,24,0.65)] ring-1 ring-stone-900/10">
            <a
              href={card.href}
              aria-label={`Xem mẫu ${card.name}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4a1520]"
            >
              <TemplatePoster face={card.face} compact />
            </a>
            <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
              <h3 className="font-invite text-[1.65rem] leading-none">{card.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-stone-600">{card.blurb}</p>
              <p className="mt-1.5 text-[11px] tracking-wide text-stone-500">{card.opening} · {card.album} · {card.gift}</p>
              <a href={card.studioHref} className={`${useButton} mt-3`}>
                Dùng mẫu này
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
