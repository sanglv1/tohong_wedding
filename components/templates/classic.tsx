import type { WeddingContent } from '@/lib/content'
import { present } from '@/lib/platform/view'
import { CoupleNames, Corners, DateLockup, Flourish, InviteRest, Kicker, Lotus, Paper, PhotoWell, When } from './craft'
import { LeafMark } from './parts'

const linkInk = 'inline-flex min-h-11 items-center rounded-full border border-current px-4 text-xs tracking-[0.16em] uppercase'

export function DoSon({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="invite-grain min-h-screen bg-[#f4ead8] text-[#3d2418]">
      <div className="bg-[#4c1018] px-3 py-8 sm:px-6 sm:py-14">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[1.25rem] border border-[#e6c98a]/75 bg-[#fffaf0] text-[#5a1a1c] shadow-[0_2px_8px_rgb(0_0_0/0.12),0_34px_60px_-28px_rgb(0_0_0/0.65)] md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-[#fffaf0] to-[#f3e2c6] p-3 sm:p-4">
            <div className="flex h-full flex-col border border-[#b08440]/60 p-2.5 outline outline-1 outline-offset-[-7px] outline-[#b08440]/30">
              <PhotoWell
                invite={invite}
                className="rounded-sm md:min-h-0 md:flex-1"
                imgClass="aspect-[4/5] h-full w-full object-cover md:aspect-auto md:min-h-[24rem]"
                empty={
                  <span className="flex h-full min-h-[16rem] w-full items-center justify-center bg-[#fff6e8] font-invite text-8xl leading-none font-bold text-[#b91c1c] md:min-h-[24rem]">
                    囍
                  </span>
                }
              />
              <div className="py-4 text-center">
                <Kicker className="text-[#8a6a3b]">{invite.ceremony.name || 'Lễ thành hôn'}</Kicker>
                <p className="mt-2 text-xl font-light tracking-[0.22em] tabular-nums">
                  {invite.date ? `${invite.date.day} · ${invite.date.month} · ${invite.date.year}` : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-[#fffaf0] to-[#f6ead3] p-3 sm:p-4">
            <div className="relative flex h-full flex-col items-center justify-center border border-[#b08440]/60 px-5 py-12 text-center outline outline-1 outline-offset-[-7px] outline-[#b08440]/30 sm:px-8">
              <Corners className="text-[#b08440]" />
              <p className="text-[1.7rem] leading-none font-bold text-[#b91c1c]" aria-hidden>
                囍
              </p>
              <Kicker className="mt-3 text-[#8a6a3b]">{invite.announcement}</Kicker>
              <CoupleNames invite={invite} nameClass="font-invite text-[2.6rem] leading-[1.08] sm:text-5xl" ampClass="my-1 font-invite text-3xl text-[#b08440]" />
              <Flourish className="mt-5 text-[#b08440]" />
              <DateLockup invite={invite} dayClass="text-[#7f1d1d]" />
              <When invite={invite} className="mt-3 text-[#7a6450]" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <InviteRest
          invite={invite}
          hideHero
          panel="rounded-2xl border border-[#e4d4b4] bg-white/75 p-6 sm:p-8"
          link={linkInk}
        />
      </div>
    </article>
  )
}

export function NgaSang({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="invite-grain min-h-screen bg-[#f7f4ee] text-[#1c1917]">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Kicker className="text-stone-500">{invite.announcement}</Kicker>
        <CoupleNames
          invite={invite}
          amp="và"
          nameClass="mt-2 font-invite text-6xl leading-[0.92] font-light sm:text-8xl"
          ampClass="mt-4 text-xs tracking-[0.45em] text-[#b08948] uppercase"
        />
        <div className="mt-8 h-px w-16 bg-[#b08948]" />
        <div className="mt-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.22em] text-stone-500 uppercase">{invite.date?.weekday}</p>
            <When invite={invite} className="mt-2 text-stone-600" />
          </div>
          <p className="font-invite text-8xl leading-none font-light sm:text-9xl">{invite.date?.day}</p>
        </div>
        <p className="mt-1 text-right text-sm tracking-[0.2em] text-stone-500">{invite.date ? `${invite.date.month} / ${invite.date.year}` : ''}</p>
        <InviteRest
          invite={invite}
          align="left"
          panel="border-t border-stone-300 pt-5"
          link={linkInk}
        />
      </div>
    </article>
  )
}

export function HongDao({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-gradient-to-b from-[#fff7f8] via-[#f8d7e2] to-[#f6ecee] px-4 py-12 text-[#5c2436] sm:px-6">
      <div className="mx-auto max-w-xl">
        <Paper line="border-white outline-white" wash="bg-white/75" className="text-center shadow-[0_24px_50px_-28px_rgb(160_70_90/0.45)]">
          <PhotoWell
            invite={invite}
            plain
            className="mx-auto h-44 w-44 rounded-full bg-white/80"
            imgClass="h-full w-full object-cover"
            empty={<span className="font-invite text-4xl text-[#c26d86]">{invite.monogram}</span>}
          />
          <Kicker className="mt-8">{invite.announcement}</Kicker>
          <CoupleNames invite={invite} ampClass="my-1 font-invite-alt text-4xl text-[#c26d86] italic" />
          <DateLockup invite={invite} dayClass="text-[#8d3d55]" />
          <When invite={invite} className="mt-3 text-[#7a4456]" />
        </Paper>
        <div className="px-2 py-12">
          <InviteRest
            invite={invite}
            hideHero
            panel="rounded-3xl bg-white/80 p-6 text-left shadow-sm"
            link="inline-flex min-h-11 items-center rounded-full bg-[#a85b73] px-4 text-xs tracking-[0.14em] text-white uppercase"
          />
        </div>
      </div>
    </article>
  )
}

export function SenTrang({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="invite-grain min-h-screen bg-white text-[#24312b]">
      <div className="mx-auto max-w-xl px-6 py-16 text-center sm:py-20">
        <Lotus />
        <Kicker className="mt-8 text-[#6e8f78]">{invite.announcement}</Kicker>
        <CoupleNames invite={invite} amp="và" ampClass="my-2 text-xs tracking-[0.42em] text-[#6e8f78] uppercase" nameClass="font-invite text-5xl leading-tight sm:text-6xl" />
        <Flourish className="mt-6 text-[#6e8f78]" />
        <DateLockup invite={invite} dayClass="text-[#2f4a3d]" />
        <When invite={invite} className="mt-3 text-[#5d7368]" />
        <InviteRest
          invite={invite}
          panel="border-t border-[#d5e3da] pt-5 text-left"
          link="inline-flex min-h-11 items-center rounded-full border border-[#6e8f78] px-4 text-xs tracking-[0.14em] text-[#3d5348] uppercase"
        />
      </div>
    </article>
  )
}

export function RungXanh({ content }: { content: WeddingContent }) {
  const invite = present(content)
  return (
    <article className="min-h-screen bg-[#e7efe8] text-[#1d332b]">
      <header className="bg-[#234237] px-6 py-5 text-[#e7f0e4]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Kicker>{invite.announcement}</Kicker>
          <p className="font-invite text-xl">{invite.date ? `${invite.date.day}.${invite.date.month}` : ''}</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-14">
        <LeafMark className="h-12 w-12 text-[#3e6b56]" />
        <CoupleNames
          invite={invite}
          amp="và"
          nameClass="mt-3 font-invite text-5xl leading-[0.95] sm:text-6xl"
          ampClass="my-2 text-xs tracking-[0.4em] text-[#3e6b56] uppercase"
        />
        <When invite={invite} className="mt-6 text-[#3d5c4e]" />
        <InviteRest
          invite={invite}
          align="left"
          panel="rounded-2xl bg-white p-6 shadow-[0_16px_40px_-28px_rgb(20_50_30/0.8)]"
          link="inline-flex min-h-11 items-center rounded-full bg-[#234237] px-4 text-xs tracking-[0.14em] text-[#e7f0e4] uppercase"
        />
      </div>
    </article>
  )
}
