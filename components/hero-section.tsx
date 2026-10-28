import { ChevronDown } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { TemplateLayout } from '@/lib/platform/templates'
import { isSignatureLayout, SignatureHero } from './signature-heroes'
import type { WeddingModel } from '@/lib/wedding-model'
import { Countdown } from './countdown'
import { GuestGreeting } from './guest-greeting'
import { HeroPhoto } from './hero-photo'
import { CornerOrnament, OrnamentDivider, SilkBloom } from './invitation-ornaments'
import { TiltCard } from './tilt-card'

function Names({ model, className }: { model: WeddingModel; className: string }) {
  const { wedding: w } = model
  return (
    <h1 className={className}>
      <span className="block">{w.groomShort}</span>
      <span className="block text-[0.55em] invite-amp my-0.5">&amp;</span>
      <span className="block">{w.brideShort}</span>
    </h1>
  )
}

function FoldHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <TiltCard className="hero-card-in">
          <article className="invite-fold grid md:grid-cols-2">
            <div className="invite-photo relative p-3 sm:p-4">
              <div className="invite-card-inner h-full flex flex-col p-2.5 sm:p-3">
                <HeroPhoto className="aspect-[4/5] md:aspect-auto md:flex-1 md:min-h-[22rem]" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
                <div className="pt-4 pb-1.5 text-center">
                  <p className="invite-kicker">Lễ thành hôn</p>
                  <p className="mt-1.5 text-xl sm:text-2xl font-light tracking-[0.25em] tabular-nums invite-date">
                    {w.dateShort.replaceAll('/', ' · ')}
                  </p>
                </div>
              </div>
            </div>
            <div className="invite-paper p-3 sm:p-4">
              <div className="invite-card-inner h-full flex flex-col items-center justify-center text-center px-5 sm:px-8 py-10 sm:py-12">
                <CornerOrnament position="top-left" />
                <CornerOrnament position="top-right" />
                <CornerOrnament position="bottom-left" />
                <CornerOrnament position="bottom-right" />
                <p className="invite-hy" aria-hidden>
                  囍
                </p>
                <p className="invite-kicker mt-2">{model.announcement}</p>
                <GuestGreeting />
                <Names model={model} className="mt-4 font-serif text-[2.6rem] sm:text-5xl leading-[1.1] invite-names invite-shimmer" />
                <OrnamentDivider className="mt-5" />
                <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4 invite-date">
                  <span className="w-[5.5rem] sm:w-24 text-right text-[0.7rem] sm:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                    {w.ceremony.dayOfWeek}
                  </span>
                  <span className="invite-date-day px-3 sm:px-4 text-4xl sm:text-5xl font-semibold tabular-nums">{w.ceremony.day}</span>
                  <span className="w-[5.5rem] sm:w-24 text-left text-[0.7rem] sm:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                    {w.ceremony.month}
                    <br />
                    {w.ceremony.year}
                  </span>
                </div>
                {w.ceremony.lunarDate && <p className="mt-2 text-xs sm:text-sm italic invite-muted">({w.ceremony.lunarDate})</p>}
                {w.ceremony.timeDisplay && <p className="mt-1 text-xs sm:text-sm invite-muted">Vào lúc {w.ceremony.timeDisplay.toLowerCase()}</p>}
                <div className="mt-6">
                  <Countdown startISO={w.startISO} endISO={w.endISO} />
                </div>
              </div>
            </div>
          </article>
        </TiltCard>
        <ScrollHint />
      </div>
    </section>
  )
}

function VeilHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="veil-hero relative pt-20 pb-10 sm:pt-24 sm:pb-14 md:pt-28">
      <div className="veil-motes" aria-hidden>
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} style={{ left: `${8 + index * 13}%`, animationDelay: `${index * 0.65}s` }} />
        ))}
      </div>
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <TiltCard className="hero-card-in">
          <article className="invite-fold invite-veil grid md:grid-cols-2">
            <div className="invite-photo relative p-3 sm:p-5">
              <div className="invite-card-inner flex h-full flex-col p-2 sm:p-3">
                <HeroPhoto className="aspect-[4/5] md:aspect-auto md:min-h-[26rem] md:flex-1" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
              </div>
            </div>
            <div className="invite-paper relative p-3 sm:p-5">
              <div className="veil-dawn" aria-hidden />
              <div className="invite-card-inner veil-letter relative flex h-full flex-col items-center justify-center px-6 py-12 text-center sm:px-10 sm:py-16">
                <p className="invite-kicker">{model.announcement}</p>
                <SilkBloom />
                <GuestGreeting />
                <Names model={model} className="veil-ink mt-5 font-serif text-[2.7rem] leading-[1.05] sm:text-5xl" />
                <p className="veil-when mt-7">
                  <span>{w.ceremony.dayOfWeek}</span>
                  {w.ceremony.day && (
                    <span className="veil-when-date">
                      {w.ceremony.day} {w.ceremony.month.toLocaleLowerCase('vi')}, {w.ceremony.year}
                    </span>
                  )}
                </p>
                {w.ceremony.lunarDate && <p className="invite-muted mt-2 text-xs italic sm:text-sm">({w.ceremony.lunarDate})</p>}
                {w.ceremony.timeDisplay && (
                  <p className="invite-muted mt-1.5 text-xs tracking-[0.14em] sm:text-sm">Vào lúc {w.ceremony.timeDisplay.toLowerCase()}</p>
                )}
                <div className="mt-7">
                  <Countdown startISO={w.startISO} endISO={w.endISO} />
                </div>
              </div>
            </div>
          </article>
        </TiltCard>
        <ScrollHint label="Câu chuyện" />
      </div>
    </section>
  )
}

function EditorialHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-12 sm:px-6 sm:pt-28">
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-[1.75rem]">
        <HeroPhoto className="aspect-[3/4]" fit="cover" framed={false} sizes="(min-width: 512px) 32rem, 92vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
        <div className="hero-on-photo absolute inset-0 flex flex-col justify-between text-center" style={photoScrim}>
          <div className="px-5 pt-8 sm:px-8 sm:pt-10">
            <p className="invite-kicker">{model.announcement}</p>
            <GuestGreeting />
            <Names model={model} className="mt-4 font-serif text-5xl leading-[0.95] invite-names sm:text-6xl" />
            {w.date && <p className="mt-4 text-sm tracking-[0.28em] uppercase invite-date">{w.date}</p>}
            {w.ceremony.location && <p className="mx-auto mt-2 max-w-xs text-sm invite-muted">{w.ceremony.location}</p>}
          </div>
          <div className="countdown-on-photo px-3 pb-5 sm:pb-6">
            <Countdown startISO={w.startISO} endISO={w.endISO} />
          </div>
        </div>
      </div>
    </section>
  )
}

function PosterHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="relative min-h-[100svh]">
      <HeroPhoto className="absolute inset-0 min-h-[100svh]" fit="cover" sizes="100vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      <div className="relative z-[1] flex min-h-[100svh] flex-col justify-end px-5 pb-16 text-center text-white sm:px-8">
        <p className="text-xs tracking-[0.35em] uppercase text-white/80">{model.announcement}</p>
        <GuestGreeting />
        <Names model={model} className="mt-4 font-serif text-5xl leading-[0.95] sm:text-7xl" />
        {w.date && <p className="mt-4 text-sm tracking-[0.22em] uppercase">{w.date}</p>}
        <div className="countdown-on-photo mt-6 text-white">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

function GardenHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-14 text-center sm:pt-28">
      <div className="mx-auto w-56 overflow-hidden rounded-full sm:w-72">
        <HeroPhoto className="aspect-square" fit="cover" sizes="(min-width: 640px) 18rem, 14rem" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
      </div>
      <p className="invite-kicker mt-8">{model.announcement}</p>
      <GuestGreeting />
      <Names model={model} className="mt-3 font-serif text-5xl leading-[1.05] invite-names sm:text-7xl" />
      {w.ceremony.lunarDate && <p className="mt-3 text-sm italic invite-muted">{w.ceremony.lunarDate}</p>}
      {w.date && <p className="mt-2 text-sm tracking-[0.18em] uppercase invite-date">{w.date}</p>}
      <div className="mt-6">
        <Countdown startISO={w.startISO} endISO={w.endISO} />
      </div>
    </section>
  )
}

function JournalHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-12 sm:px-6 sm:pt-28">
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-[1.75rem]">
        <HeroPhoto className="aspect-[3/5]" fit="cover" framed={false} position="50% 42%" sizes="(min-width: 512px) 32rem, 92vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
        <div className="hero-on-photo absolute inset-0 flex flex-col justify-between text-center" style={photoScrim}>
          <div className="px-5 pt-6 sm:px-8 sm:pt-8">
            <p className="invite-kicker">{model.announcement}</p>
            <p className="mt-2 text-sm tracking-[0.16em] uppercase invite-date">
              {w.ceremony.month} {w.ceremony.year}
            </p>
            <p className="mt-1 font-serif text-5xl leading-none tabular-nums text-[#fffaf0] sm:text-6xl">{w.ceremony.day || '—'}</p>
            <Names model={model} className="mt-2 font-serif text-[2rem] leading-[1.05] invite-names sm:text-5xl" />
            <GuestGreeting />
          </div>
          <div className="countdown-on-photo px-3 pb-5 sm:pb-6">
            <Countdown startISO={w.startISO} endISO={w.endISO} />
          </div>
        </div>
      </div>
    </section>
  )
}

function SplitHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="grid md:min-h-[88svh] md:grid-cols-2">
      <HeroPhoto className="min-h-[48svh] md:min-h-[88svh]" fit="cover" sizes="(min-width: 768px) 50vw, 100vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
      <div className="flex flex-col justify-center px-6 py-12 text-center md:px-12 md:text-left">
        <p className="invite-kicker">{model.announcement}</p>
        <GuestGreeting />
        <Names model={model} className="mt-4 font-serif text-5xl leading-[0.95] invite-names sm:text-7xl" />
        {w.date && <p className="mt-4 text-sm tracking-[0.22em] uppercase invite-date">{w.date}</p>}
        {w.ceremony.location && <p className="mt-2 text-sm invite-muted">{w.ceremony.location}</p>}
        <div className="mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

function BandHero({ model }: { model: WeddingModel }) {
  const { wedding: w } = model
  return (
    <section className="px-4 pt-24 pb-12 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-md overflow-hidden rounded-[1.75rem]">
        <HeroPhoto className="aspect-[3/4]" fit="cover" sizes="(min-width: 448px) 28rem, 92vw" hero={model.hero} groomShort={w.groomShort} brideShort={w.brideShort} />
      </div>
      <div className="mx-auto max-w-3xl py-10 text-center">
        <p className="font-serif text-7xl leading-none tabular-nums invite-names sm:text-8xl">{w.ceremony.day || '—'}</p>
        <p className="mt-2 text-sm tracking-[0.2em] uppercase invite-date">
          {w.ceremony.month} {w.ceremony.year}
        </p>
        <Names model={model} className="mt-5 font-serif text-5xl leading-[0.95] invite-names sm:text-6xl" />
        <p className="invite-kicker mt-4">{model.announcement}</p>
        <GuestGreeting />
        {w.ceremony.location && <p className="mt-3 text-sm invite-muted">{w.ceremony.location}</p>}
        <div className="mt-6">
          <Countdown startISO={w.startISO} endISO={w.endISO} />
        </div>
      </div>
    </section>
  )
}

const photoScrim = {
  background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.58) 0%, rgb(0 0 0 / 0.16) 34%, transparent 52%, rgb(0 0 0 / 0.5) 100%)',
}

function ScrollHint({ label }: { label?: string }) {
  return (
    <a
      href="#cau-chuyen"
      className="mx-auto mt-6 flex w-fit min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 p-2 text-w-muted transition-colors hover:text-w-strong touch-manipulation sm:mt-8"
      aria-label="Cuộn xuống phần câu chuyện"
    >
      {label && <span className="text-[0.68rem] tracking-[0.22em] uppercase">{label}</span>}
      <ChevronDown className="h-5 w-5" />
    </a>
  )
}

export function HeroSection({
  model = CLASSIC_MODEL,
  layout = 'fold',
}: {
  model?: WeddingModel
  layout?: TemplateLayout
}) {
  if (isSignatureLayout(layout)) return <SignatureHero model={model} layout={layout} />
  if (layout === 'veil') return <VeilHero model={model} />
  if (layout === 'editorial') return <EditorialHero model={model} />
  if (layout === 'poster') return <PosterHero model={model} />
  if (layout === 'garden') return <GardenHero model={model} />
  if (layout === 'journal') return <JournalHero model={model} />
  if (layout === 'split') return <SplitHero model={model} />
  if (layout === 'band') return <BandHero model={model} />
  return <FoldHero model={model} />
}
