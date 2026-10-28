import type { TemplateLayout } from '@/lib/platform/templates'
import type { WeddingModel } from '@/lib/wedding-model'
import { Countdown } from './countdown'
import { GuestGreeting } from './guest-greeting'
import { HeroPhoto } from './hero-photo'

export const SIGNATURE_LAYOUTS = [
  'scroll',
  'constellation',
  'marquee',
  'tile',
  'court',
  'tide',
  'lantern',
  'broadsheet',
  'ledger',
  'mosaic',
] as const

export type SignatureLayout = (typeof SIGNATURE_LAYOUTS)[number]

export function isSignatureLayout(layout: TemplateLayout): layout is SignatureLayout {
  return (SIGNATURE_LAYOUTS as readonly string[]).includes(layout)
}

function Names({ model, className }: { model: WeddingModel; className: string }) {
  const { wedding: w } = model
  return (
    <h1 className={className}>
      <span className="block">{w.groomShort}</span>
      <span className="my-1 block text-[0.42em] tracking-[0.35em] opacity-70">&amp;</span>
      <span className="block">{w.brideShort}</span>
    </h1>
  )
}

function ScrollHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-14 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-4xl">
        <div className="sig-roller mx-auto h-3.5 w-[94%] rounded-full bg-[#2a2118] shadow-inner" />
        <div className="border-x border-[#2a2118]/25 bg-[#f7f1e4] px-4 py-8 text-[#2a2118] sm:px-8">
          <div className="grid items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="hidden h-[26rem] items-center justify-center md:flex" style={{ writingMode: 'vertical-rl' }}>
              <p className="font-serif text-5xl leading-none">{w.groomShort}</p>
              <p className="mx-3 text-xs tracking-[0.4em]">與</p>
              <p className="font-serif text-5xl leading-none">{w.brideShort}</p>
            </div>
            <HeroPhoto
              className="aspect-[3/4]"
              fit="cover"
              sizes="(min-width: 768px) 28rem, 92vw"
              hero={model.hero}
              groomShort={w.groomShort}
              brideShort={w.brideShort}
            />
            <div className="flex flex-col items-center gap-4 text-center md:h-[26rem] md:justify-between">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8b1e1e] font-serif text-3xl text-[#f8e7c8] shadow-[inset_0_0_0_3px_rgb(248_231_200/0.45)]">
                囍
              </span>
              <div className="md:hidden">
                <Names model={model} className="font-serif text-5xl leading-none" />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase">{model.announcement}</p>
                <GuestGreeting />
                <p className="mt-2 font-serif text-4xl leading-none tabular-nums">{w.ceremony.day || '—'}</p>
                <p className="mt-1 text-xs tracking-[0.16em]">
                  {w.ceremony.month} {w.ceremony.year}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Countdown startISO={w.startISO} endISO={w.endISO} />
          </div>
        </div>
        <div className="sig-roller mx-auto h-3.5 w-[94%] rounded-full bg-[#2a2118] shadow-inner" />
      </div>
    </section>
  )
}

function ConstellationHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(1.2px 1.2px at 12% 22%, #fff 50%, transparent 52%), radial-gradient(1.4px 1.4px at 28% 68%, #fff 50%, transparent 52%), radial-gradient(1px 1px at 72% 18%, #fff 50%, transparent 52%), radial-gradient(1.6px 1.6px at 84% 46%, #fff 50%, transparent 52%), radial-gradient(1px 1px at 48% 12%, #fff 50%, transparent 52%), radial-gradient(1.3px 1.3px at 62% 78%, #fff 50%, transparent 52%), radial-gradient(1px 1px at 18% 84%, #fff 50%, transparent 52%)',
        }}
      />
      <div className="relative z-[1] mx-auto flex min-h-[100svh] max-w-lg flex-col items-center justify-center px-6 pt-24 pb-16 text-center text-white">
        <div className="h-28 w-28 overflow-hidden rounded-full ring-1 ring-white/50 sm:h-36 sm:w-36">
          <HeroPhoto className="h-full w-full" fit="cover" framed={false} sizes="9rem" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
        </div>
        <p className="mt-8 text-[11px] tracking-[0.42em] uppercase text-white/70">{model.announcement}</p>
        <GuestGreeting />
        <p className="mt-4 font-serif text-5xl leading-none sm:text-7xl">{w.groomShort}</p>
        <div className="my-4 h-px w-16 bg-white/60" />
        <p className="font-serif text-5xl leading-none sm:text-7xl">{w.brideShort}</p>
        {w.date && <p className="mt-6 text-xs tracking-[0.28em] uppercase text-white/75">{w.date}</p>}
        <div className="countdown-on-photo mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

function MarqueeHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  const bulbs = Array.from({ length: 18 }, (_, index) => index)
  return (
    <section className="px-4 pt-24 pb-12 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-3xl bg-[#1a0c12] p-3 text-[#f8efd8] shadow-[0_30px_60px_-36px_rgb(0_0_0/0.8)]">
        <div className="flex justify-between px-2">
          {bulbs.map((bulb) => (
            <span key={bulb} className="sig-bulb h-2.5 w-2.5 rounded-full bg-[#f6e27a] shadow-[0_0_8px_#f6e27a]" />
          ))}
        </div>
        <div className="border border-[#e8c56b]/50 px-5 py-8 text-center sm:px-10">
          <p className="text-[11px] tracking-[0.5em] text-[#e8c56b] uppercase">{model.announcement}</p>
          <GuestGreeting />
          <h1 className="mt-4 font-sans text-5xl leading-[0.9] font-semibold tracking-tight uppercase sm:text-7xl">
            {w.groomShort}
            <span className="mx-3 text-[0.4em] tracking-[0.3em] text-[#e8c56b]">&amp;</span>
            {w.brideShort}
          </h1>
          <div className="mx-auto mt-6 max-w-xs border border-dashed border-[#e8c56b]/70 px-4 py-3">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#e8c56b]">Vé mời</p>
            <p className="mt-1 text-sm tracking-[0.14em]">{w.date || 'Ngày cưới'}</p>
            {w.ceremony.location && <p className="mt-1 text-xs text-[#f8efd8]/75">{w.ceremony.location}</p>}
          </div>
          <div className="countdown-on-photo mt-6">
            <Countdown startISO={w.startISO} endISO={w.endISO} />
          </div>
        </div>
        <div className="mt-3 flex justify-between px-2">
          {bulbs.map((bulb) => (
            <span key={bulb} className="sig-bulb h-2.5 w-2.5 rounded-full bg-[#f6e27a] shadow-[0_0_8px_#f6e27a]" />
          ))}
        </div>
      </div>
    </section>
  )
}

function TileHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section
      className="px-4 pt-24 pb-14 sm:px-6 sm:pt-28"
      style={{
        backgroundImage:
          'linear-gradient(45deg, rgb(196 92 62 / 0.18) 25%, transparent 25%), linear-gradient(-45deg, rgb(196 92 62 / 0.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(30 26 58 / 0.12) 75%), linear-gradient(-45deg, transparent 75%, rgb(30 26 58 / 0.12) 75%)',
        backgroundSize: '28px 28px',
        backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0',
      }}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="w-64 rotate-45 overflow-hidden border-8 border-white shadow-[0_20px_40px_-24px_rgb(30_26_58/0.7)] sm:w-80">
          <div className="-rotate-45 scale-150">
            <HeroPhoto className="aspect-square" fit="cover" framed={false} sizes="20rem" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
          </div>
        </div>
        <p className="mt-10 text-[11px] tracking-[0.32em] uppercase">{model.announcement}</p>
        <GuestGreeting />
        <Names model={model} className="mt-3 font-serif text-5xl leading-[0.95] sm:text-6xl" />
        {w.date && <p className="mt-3 text-sm tracking-[0.18em] uppercase">{w.date}</p>}
        <div className="mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

function CourtHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-14 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-xl border-2 border-[#e6c36a] p-2 text-center">
        <div className="border border-[#e6c36a]/70 px-6 py-10 sm:px-10">
          <p className="text-5xl text-[#e6c36a]" aria-hidden>
            囍
          </p>
          <p className="mt-3 text-[11px] tracking-[0.38em] text-[#e6c36a] uppercase">{model.announcement}</p>
          <GuestGreeting />
          <div className="mx-auto mt-5 max-w-[16rem] overflow-hidden border border-[#e6c36a]/60">
            <HeroPhoto className="aspect-[4/3]" fit="cover" framed={false} sizes="16rem" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
          </div>
          <Names model={model} className="mt-6 font-serif text-5xl leading-none sm:text-6xl" />
          <p className="mt-4 text-sm tracking-[0.22em]">{w.date}</p>
          {w.ceremony.lunarDate && <p className="mt-1 text-xs italic opacity-80">{w.ceremony.lunarDate}</p>}
          <div className="mt-6">
            <Countdown startISO={w.startISO} endISO={w.endISO} />
          </div>
        </div>
      </div>
    </section>
  )
}

function TideHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="pt-24 sm:pt-28">
      <HeroPhoto className="aspect-[16/8] max-h-[46svh]" fit="cover" sizes="100vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
      <svg viewBox="0 0 1440 80" className="sig-wave block w-full text-w-bg" aria-hidden preserveAspectRatio="none">
        <path fill="currentColor" d="M0 40c120 30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0v40H0z" />
      </svg>
      <div className="-mt-1 px-6 pb-14 text-center">
        <p className="text-[11px] tracking-[0.32em] uppercase">{model.announcement}</p>
        <GuestGreeting />
        <Names model={model} className="mt-3 font-serif text-5xl leading-[0.95] italic sm:text-7xl" />
        {w.date && <p className="mt-3 text-sm tracking-[0.2em]">{w.date}</p>}
        {w.ceremony.location && <p className="mt-2 text-sm invite-muted">{w.ceremony.location}</p>}
        <div className="mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

function LanternShape() {
  return (
    <div className="sig-lantern flex flex-col items-center" aria-hidden>
      <span className="h-4 w-px bg-[#e8a040]" />
      <span className="flex h-16 w-10 items-center justify-center rounded-[1.2rem] bg-[#e8a040] text-[10px] text-[#2a1608] shadow-[0_0_18px_rgb(232_160_64/0.55)]">囍</span>
      <span className="h-3 w-px bg-[#e8a040]" />
      <span className="h-2 w-2 rounded-full bg-[#e8a040]" />
    </div>
  )
}

function LanternHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-14 text-center sm:pt-28">
      <div className="mx-auto flex max-w-xl items-start justify-center gap-4 sm:gap-8">
        <LanternShape />
        <div className="mt-6 h-56 w-56 overflow-hidden rounded-full ring-4 ring-[#e8a040]/80 sm:h-72 sm:w-72">
          <HeroPhoto className="h-full w-full" fit="cover" framed={false} sizes="18rem" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
        </div>
        <LanternShape />
      </div>
      <p className="mt-8 text-[11px] tracking-[0.34em] text-[#e8a040] uppercase">{model.announcement}</p>
      <GuestGreeting />
      <Names model={model} className="mt-3 font-serif text-5xl leading-none sm:text-6xl" />
      {w.date && <p className="mt-3 text-sm tracking-[0.18em]">{w.date}</p>}
      <div className="mt-6">
        <Countdown startISO={w.startISO} endISO={w.endISO} />
      </div>
    </section>
  )
}

function BroadsheetHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-12 sm:px-6 sm:pt-28">
      <article className="mx-auto max-w-3xl border-y-4 border-double border-current px-2 py-6 text-center sm:px-6">
        <p className="font-sans text-[11px] tracking-[0.55em] uppercase">Báo hỷ</p>
        <h1 className="mt-2 font-sans text-5xl leading-none font-black tracking-tight sm:text-7xl">{w.dateShort || w.date || 'Ngày cưới'}</h1>
        <div className="mt-3 border-y border-current py-2 font-sans text-sm tracking-[0.18em] uppercase">
          {w.groomShort} kết hôn cùng {w.brideShort}
        </div>
        <div className="mt-5 grid gap-4 text-left md:grid-cols-[1.1fr_0.9fr]">
          <HeroPhoto className="aspect-[4/3]" fit="cover" sizes="(min-width: 768px) 24rem, 92vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
          <div>
            <p className="font-sans text-xs tracking-[0.22em] uppercase">{model.announcement}</p>
            <GuestGreeting />
            <p className="mt-3 font-sans text-sm leading-6">
              {w.ceremony.dayOfWeek} {w.ceremony.day} {w.ceremony.month} {w.ceremony.year}
              {w.ceremony.timeDisplay ? `, vào lúc ${w.ceremony.timeDisplay.toLowerCase()}` : ''}.
              {w.ceremony.location ? ` ${w.ceremony.location}.` : ''}
            </p>
            {w.ceremony.lunarDate && <p className="mt-2 font-sans text-sm italic">{w.ceremony.lunarDate}</p>}
          </div>
        </div>
        <div className="mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </article>
    </section>
  )
}

function LedgerHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-14 sm:px-6 sm:pt-28">
      <div
        className="mx-auto max-w-xl px-6 py-8 shadow-[0_18px_40px_-28px_rgb(60_40_20/0.55)] sm:px-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 1.85rem, rgb(29 78 137 / 0.28) 1.9rem)',
          backgroundPosition: '0 2.4rem',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-[#1d4e89]">{model.announcement}</p>
          <p className="rotate-[-6deg] border-2 border-[#9b2c32] px-2 py-1 font-sans text-xs font-semibold tracking-wide text-[#9b2c32] uppercase">
            {w.dateShort || w.ceremony.day}
          </p>
        </div>
        <GuestGreeting />
        <Names model={model} className="mt-6 font-serif text-5xl leading-[0.95] sm:text-6xl" />
        <div className="mt-6 ml-auto w-44 -rotate-2 overflow-hidden shadow-md sm:w-52">
          <HeroPhoto className="aspect-[4/5]" fit="cover" framed={false} sizes="13rem" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
        </div>
        {w.ceremony.location && <p className="mt-4 max-w-xs font-serif text-2xl leading-snug">{w.ceremony.location}</p>}
        <div className="mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

function MosaicHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-3 pt-24 pb-12 sm:px-6 sm:pt-28">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <div className="col-span-2 overflow-hidden sm:row-span-2">
          <HeroPhoto
            className="aspect-[4/5] sm:aspect-auto sm:h-full sm:min-h-[28rem]"
            fit="cover"
            framed={false}
            sizes="(min-width: 640px) 40rem, 92vw"
            hero={model.hero}
            groomShort={w.groomShort}
            brideShort={w.brideShort}
          />
        </div>
        <div className="flex min-h-36 flex-col justify-end bg-w-strong p-4 text-w-bg">
          <p className="font-sans text-[10px] tracking-[0.28em] uppercase opacity-70">{model.announcement}</p>
          <p className="mt-2 font-sans text-3xl leading-none font-semibold sm:text-4xl">{w.groomShort}</p>
        </div>
        <div className="flex min-h-36 flex-col justify-end border border-w-line p-4">
          <p className="font-sans text-[10px] tracking-[0.28em] uppercase opacity-70">&amp;</p>
          <p className="mt-2 font-sans text-3xl leading-none font-semibold sm:text-4xl">{w.brideShort}</p>
          <GuestGreeting />
        </div>
        <div className="col-span-2 border border-w-line p-4">
          <p className="font-sans text-4xl leading-none font-semibold tabular-nums sm:text-6xl">{w.ceremony.day || '—'}</p>
          <p className="mt-2 font-sans text-xs tracking-[0.18em] uppercase">
            {w.ceremony.month} {w.ceremony.year}
          </p>
          {w.ceremony.location && <p className="mt-2 text-sm">{w.ceremony.location}</p>}
        </div>
        <div className="col-span-2 flex items-center justify-center bg-w-tint p-3 sm:col-span-1">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

const HEROES: Record<SignatureLayout, typeof ScrollHero> = {
  scroll: ScrollHero,
  constellation: ConstellationHero,
  marquee: MarqueeHero,
  tile: TileHero,
  court: CourtHero,
  tide: TideHero,
  lantern: LanternHero,
  broadsheet: BroadsheetHero,
  ledger: LedgerHero,
  mosaic: MosaicHero,
}

export function SignatureHero({ model, layout }: { model: WeddingModel; layout: SignatureLayout }) {
  const Hero = HEROES[layout]
  return <Hero model={model} />
}
