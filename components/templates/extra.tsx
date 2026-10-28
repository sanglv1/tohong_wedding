import type { WeddingContent } from '@/lib/content'
import { present } from '@/lib/platform/view'
import { Corners, CoupleNames, DateLockup, Flourish, InviteRest, Kicker, Paper, When } from './craft'

export function MucTau({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="invite-grain min-h-screen bg-[#f7f3ea] text-[#1a1a1a]">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-10">
        <div className="flex items-start justify-between gap-6">
          <Kicker>{invite.announcement}</Kicker>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border-2 border-[#9c2b2b] font-invite text-3xl text-[#9c2b2b]" aria-hidden>
            囍
          </div>
        </div>
        <CoupleNames
          invite={invite}
          amp=""
          nameClass="mt-6 font-invite text-6xl leading-[0.9] font-medium sm:text-7xl"
          ampClass="hidden"
        />
        <svg viewBox="0 0 240 16" className="mt-4 h-4 w-40" aria-hidden>
          <path d="M2 10c30-8 50 6 80-2 28-6 40 8 70 0 20-6 40 4 70-2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <p className="mt-8 max-w-md text-base leading-8">{invite.date ? `${invite.date.weekday}, ${invite.date.full}` : ''}</p>
        <When invite={invite} />
        <InviteRest
          invite={invite}
          align="left"
          panel="border-l-2 border-[#9c2b2b] pl-5"
          link="inline-flex min-h-11 items-center rounded-full border border-[#1a1a1a] px-4 text-xs tracking-[0.14em] uppercase"
        />
      </div>
    </article>
  )
}

export function ThoNgan({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="invite-grain min-h-screen bg-[#f4f0e8] text-[#2c261f]">
      <div className="mx-auto max-w-xl px-6 py-20 sm:px-8">
        <p className="font-invite-alt text-2xl leading-snug italic text-[#6b5c49]">{invite.announcement}</p>
        <CoupleNames
          invite={invite}
          amp="và"
          nameClass="mt-4 font-invite-alt text-6xl leading-[0.95] italic sm:text-7xl"
          ampClass="my-3 text-sm tracking-[0.35em] text-[#8a7964] uppercase"
        />
        <div className="mt-10 h-px w-12 bg-[#8a7964]" />
        <p className="mt-6 font-invite text-3xl">{invite.date ? `${invite.date.day} tháng ${invite.date.month}` : ''}</p>
        <p className="text-sm">{invite.date ? `${invite.date.weekday} · ${invite.date.year}` : ''}</p>
        <When invite={invite} className="mt-2 text-[#6b5c49]" />
        <InviteRest
          invite={invite}
          align="left"
          panel="border-t border-[#ddd4c6] pt-5"
          link="inline-flex min-h-11 items-center rounded-full border border-[#2c261f] px-4 text-xs tracking-[0.14em] uppercase"
        />
      </div>
    </article>
  )
}

export function TapChi({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-white text-stone-950">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <div className="flex items-center justify-between border-b-2 border-stone-950 pb-2 text-[10px] tracking-[0.28em] uppercase">
          <span>Số 01</span>
          <span>{invite.date?.year ?? 'Thiệp'}</span>
          <span>Thiệp mời</span>
        </div>
        <Kicker className="mt-8">{invite.announcement}</Kicker>
        <h1 className="mt-3 text-balance">
          <span className="block font-invite text-6xl leading-[0.86] sm:text-8xl">{invite.names.groom}</span>
          <span className="mt-1 block font-invite-alt text-5xl leading-[0.9] italic sm:text-7xl">{invite.names.bride}</span>
        </h1>
        <div className="-mx-6 mt-8 bg-stone-950 px-6 py-8 text-white sm:-mx-10 sm:px-10">
          <Kicker>{invite.date?.weekday ?? ''}</Kicker>
          <p className="mt-2 font-invite text-4xl sm:text-5xl">{invite.date ? `${invite.date.day}.${invite.date.month}.${invite.date.year}` : ''}</p>
          <When invite={invite} className="mt-2 text-white/75" />
        </div>
        <InviteRest
          invite={invite}
          align="left"
          panel="border-t border-stone-300 pt-5"
          link="inline-flex min-h-11 items-center rounded-full bg-stone-950 px-4 text-xs tracking-[0.14em] text-white uppercase"
        />
      </div>
    </article>
  )
}

export function ThuyTinh({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article
      className="min-h-screen px-4 py-10 text-stone-800 sm:py-14"
      style={{
        background:
          'radial-gradient(ellipse at 8% 0%, #f7c5d2 0%, transparent 52%), radial-gradient(ellipse at 100% 12%, #d9d6f5 0%, transparent 46%), radial-gradient(ellipse at 50% 100%, #f6e3c4 0%, transparent 48%), #f7f4ef',
      }}
    >
      <div className="mx-auto max-w-xl">
        <div className="rounded-[2rem] border border-white/80 bg-white/70 p-7 text-center shadow-[0_24px_70px_rgb(90_60_40/0.1)] backdrop-blur-md sm:p-10">
          <Kicker className="inline-flex rounded-full bg-white px-3 py-2 text-stone-500">{invite.announcement}</Kicker>
          <CoupleNames invite={invite} ampClass="my-1 text-3xl text-stone-400" nameClass="font-invite text-5xl leading-[0.95] sm:text-6xl" />
          <DateLockup invite={invite} />
          <When invite={invite} className="mt-3 text-stone-500" />
        </div>
        <div className="px-2 py-12">
          <InviteRest
            invite={invite}
            panel="rounded-2xl bg-white/80 p-6 text-left"
            link="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-4 text-xs tracking-[0.14em] text-white uppercase"
          />
        </div>
      </div>
    </article>
  )
}

export function PhongBi({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-[#7a1828] px-4 py-8 text-[#3a241c] sm:py-12">
      <div className="mx-auto max-w-xl">
        <svg viewBox="0 0 400 86" className="block w-full text-[#9a2436]" aria-hidden>
          <path d="M0 0h400v22L200 86 0 22z" fill="currentColor" />
          <path d="M0 22L200 86 400 22" fill="none" stroke="#f3e0b0" strokeWidth="1.2" />
        </svg>
        <div className="-mt-6">
          <Paper line="border-[#c4a36a]/80 outline-[#c4a36a]/45" wash="invite-grain bg-[#f7f1e6]" className="text-center shadow-[0_22px_40px_rgb(60_10_16/0.28)]">
            <Corners className="text-[#9a2436]" />
            <Kicker className="text-[#9a2436]">{invite.announcement}</Kicker>
            <CoupleNames invite={invite} nameClass="font-invite text-5xl leading-none sm:text-6xl" ampClass="my-2 font-invite text-3xl text-[#9a2436]" />
            <Flourish className="mt-5 text-[#9a2436]" />
            <DateLockup invite={invite} dayClass="text-[#7a1828]" />
            <When invite={invite} className="mt-3 text-[#6d5348]" />
          </Paper>
        </div>
        <div className="px-2 py-10 text-[#f7f1e6]">
          <InviteRest
            invite={invite}
            panel="rounded-2xl border border-[#e6c98a]/30 bg-white/10 p-6 text-left"
            link="inline-flex min-h-11 items-center rounded-full bg-[#f7f1e6] px-4 text-xs tracking-[0.14em] text-[#7a1828] uppercase"
          />
        </div>
      </div>
    </article>
  )
}
