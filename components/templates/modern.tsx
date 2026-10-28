import type { WeddingContent } from '@/lib/content'
import { present } from '@/lib/platform/view'
import { Corners, CoupleNames, DateLockup, Flourish, InviteRest, Kicker, Paper, Wave, When } from './craft'
import { HeroPhoto } from './parts'

export function DemVang({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-[#0c0b09] px-4 py-14 text-[#f4e7c5] sm:px-6 sm:py-20">
      <div className="mx-auto max-w-xl">
        <Paper line="border-[#d4b483]/55 outline-[#d4b483]/40" wash="bg-[#14120e]" className="text-center">
          <Corners className="text-[#d4b483]" />
          <Kicker className="text-[#d4b483]">{invite.announcement}</Kicker>
          <CoupleNames invite={invite} amp="và" nameClass="mt-3 font-invite text-5xl font-light tracking-wide sm:text-6xl" ampClass="my-4 text-xs tracking-[0.5em] text-[#d4b483] uppercase" />
          <div className="mx-auto mt-8 w-48 border border-[#d4b483]/50 py-6">
            <DateLockup invite={invite} />
          </div>
          <When invite={invite} className="mt-4 text-[#d4b483]" />
        </Paper>
        <div className="py-12">
          <InviteRest
            invite={invite}
            panel="rounded-2xl border border-[#d4b483]/30 bg-white/5 p-6"
            link="inline-flex min-h-11 items-center rounded-full border border-[#d4b483]/60 px-4 text-[11px] tracking-[0.16em] uppercase"
          />
        </div>
      </div>
    </article>
  )
}

export function AnhSang({ content }: { content: WeddingContent }) {
  const invite = present(content)
  const photo = invite.photos[0]
  return (
    <article className="min-h-screen bg-[#f6f1ea] text-[#2a211c]">
      <div className="relative min-h-[82vh] bg-[#2a211c]">
        {photo ? (
          <HeroPhoto src={photo.src} alt={photo.alt} focus={photo.focus} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-invite text-7xl text-[#e6c98a]">囍</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a120e] via-[#1a120e]/20 to-[#1a120e]/25" />
        <div className="relative flex min-h-[82vh] flex-col items-center justify-end px-6 pb-16 text-center text-[#f6efe6]">
          <Kicker>{invite.announcement}</Kicker>
          <CoupleNames invite={invite} nameClass="font-invite text-5xl leading-none sm:text-7xl" ampClass="my-2 font-invite text-3xl text-[#e6c98a]" />
          <p className="mt-4 text-sm tracking-wide">{invite.date ? `${invite.date.weekday} · ${invite.date.day}.${invite.date.month}.${invite.date.year}` : ''}</p>
          <When invite={invite} className="mt-1 text-[#e6c98a]" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-14">
        <InviteRest
          invite={invite}
          hideHero
          panel="rounded-2xl bg-white p-6 text-left shadow-sm"
          link="inline-flex min-h-11 items-center rounded-full bg-[#2a211c] px-4 text-xs tracking-[0.14em] text-[#f6f1ea] uppercase"
        />
      </div>
    </article>
  )
}

export function BienCat({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-[#f6f1e8] text-[#1c3c4e]">
      <div className="relative h-72 bg-gradient-to-b from-[#6eafc4] via-[#d7f3ea] to-[#f6f1e8]">
        <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center px-6 pb-10 text-center text-[#143646]">
          <Kicker>{invite.date?.weekday ?? ''}</Kicker>
          <p className="font-invite text-7xl font-light">{invite.date ? `${invite.date.day}.${invite.date.month}` : ''}</p>
          <p className="text-sm tracking-[0.22em]">{invite.date?.year}</p>
        </div>
        <Wave />
      </div>
      <div className="mx-auto -mt-6 max-w-xl px-5 pb-16 text-center">
        <Paper line="border-[#8ec6d4] outline-[#8ec6d4]" wash="bg-white/80">
          <Kicker className="text-[#4d7c8a]">{invite.announcement}</Kicker>
          <CoupleNames invite={invite} ampClass="font-invite-alt text-3xl text-[#4d7c8a] italic" nameClass="font-invite text-5xl leading-tight sm:text-6xl" />
          <When invite={invite} className="mt-4" />
        </Paper>
        <InviteRest
          invite={invite}
          panel="rounded-3xl bg-white/85 p-6 text-left"
          link="inline-flex min-h-11 items-center rounded-full bg-[#1c3c4e] px-4 text-xs tracking-[0.14em] text-[#f6f1e8] uppercase"
        />
      </div>
    </article>
  )
}

export function DatNung({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-[#f6efe6] text-[#3d241c]">
      <div className="bg-[#c45c3e] px-6 py-16 text-center text-[#fff6f1]">
        <Kicker>{invite.announcement}</Kicker>
        <p className="mt-4 font-invite text-8xl leading-none font-light sm:text-9xl">{invite.date?.day}</p>
        <p className="mt-3 text-sm tracking-[0.18em] uppercase">{invite.date ? `${invite.date.weekday} · tháng ${invite.date.month} · ${invite.date.year}` : ''}</p>
        <When invite={invite} className="mt-2 text-[#ffe7dc]" />
      </div>
      <div className="mx-auto -mt-10 max-w-3xl rounded-t-[2rem] bg-[#f6efe6] px-6 py-12">
        <CoupleNames
          invite={invite}
          amp=""
          nameClass="font-invite-alt text-5xl leading-[0.95] italic sm:text-6xl"
          ampClass="my-3 block h-px w-12 bg-[#c45c3e]"
        />
        <Flourish className="mt-6 text-[#a24b34]" />
        <InviteRest
          invite={invite}
          align="left"
          panel="border-t border-[#e4d3c4] pt-5"
          link="inline-flex min-h-11 items-center rounded-full bg-[#c45c3e] px-4 text-xs tracking-[0.14em] text-white uppercase"
        />
      </div>
    </article>
  )
}

export function KhacDau({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="invite-grain min-h-screen bg-[#f3efe6] px-4 py-10 text-[#241c16] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Paper line="border-[#241c16]/70 outline-[#241c16]/35" wash="bg-[#f7f3ea]" className="text-center">
          <Corners className="text-[#241c16]" />
          <p className="pointer-events-none absolute inset-x-0 top-10 text-center font-invite text-[7rem] leading-none text-[#241c16]/10">{invite.monogram}</p>
          <div className="relative">
            <Kicker>{invite.announcement}</Kicker>
            <CoupleNames invite={invite} ampClass="mx-auto my-4 block h-px w-10 bg-current text-[0]" nameClass="mt-8 font-invite text-5xl leading-none sm:text-6xl" />
            <DateLockup invite={invite} />
            <When invite={invite} className="mt-3" />
          </div>
        </Paper>
        <div className="py-12">
          <InviteRest invite={invite} panel="border-t border-[#d9d0c3] pt-5 text-left" link="inline-flex min-h-11 items-center rounded-full border border-[#241c16] px-4 text-xs tracking-[0.14em] uppercase" />
        </div>
      </div>
    </article>
  )
}
