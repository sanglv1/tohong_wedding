import type { ReactElement } from 'react'
import type { SignatureLayout } from '@/components/signature-heroes'

type FaceProps = {
  announcement: string
  groom: string
  bride: string
  date: string
  guestName: string
  inviteLine: string
  showInviteLine: boolean
  opening: boolean
  onOpen: () => void
}

function GuestBlock({
  guestName,
  inviteLine,
  showInviteLine,
  className = '',
}: Pick<FaceProps, 'guestName' | 'inviteLine' | 'showInviteLine'> & { className?: string }) {
  if (!guestName && !showInviteLine) return null
  return (
    <div className={className}>
      {showInviteLine && <p className="text-[11px] uppercase tracking-[0.28em]">{inviteLine}</p>}
      {guestName && <p className="mt-1 break-words font-serif text-2xl">{guestName}</p>}
    </div>
  )
}

function OpenButton({
  onOpen,
  opening,
  className,
}: {
  onOpen: () => void
  opening: boolean
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={opening}
      autoFocus
      className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-80 ${className}`}
    >
      Mở thiệp cưới
    </button>
  )
}

function Names({ groom, bride, className }: { groom: string; bride: string; className: string }) {
  return (
    <h2 id="cover-title" className={className}>
      <span className="block">{groom}</span>
      <span className="sr-only"> và </span>
      <span className="block">{bride}</span>
    </h2>
  )
}

function ScrollFace(props: FaceProps) {
  return (
    <div className="bg-[#f7f1e4] px-5 py-6 text-[#2a2118] shadow-[0_24px_50px_-28px_rgb(42_33_24/0.7)] sm:px-7">
      <div className="mx-auto h-3 w-[92%] rounded-full bg-[#2a2118] shadow-inner" />
      <div className="mx-3 border-x border-[#2a2118]/20 px-4 py-7 text-center">
        <p className="text-[11px] uppercase tracking-[0.32em]">{props.announcement}</p>
        <h2 id="cover-title" className="mt-5 font-serif text-4xl leading-none sm:text-5xl">
          <span className="block">{props.groom}</span>
          <span className="mx-auto my-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8b1e1e] font-serif text-2xl text-[#f8e7c8] shadow-[inset_0_0_0_3px_rgb(248_231_200/0.4)]">
            囍
          </span>
          <span className="sr-only"> và </span>
          <span className="block">{props.bride}</span>
        </h2>
        <p className="mt-5 text-sm tracking-[0.22em]">{props.date}</p>
        <GuestBlock {...props} className="mt-4" />
        <OpenButton
          onOpen={props.onOpen}
          opening={props.opening}
          className="mt-7 border-b border-[#8b1e1e] pb-1 text-xs uppercase tracking-[0.28em] text-[#8b1e1e]"
        />
      </div>
      <div className="mx-auto h-3 w-[92%] rounded-full bg-[#2a2118] shadow-inner" />
    </div>
  )
}

function ConstellationFace(props: FaceProps) {
  return (
    <div className="px-4 py-8 text-center text-white">
      <p className="text-[11px] uppercase tracking-[0.42em] text-white/70">{props.announcement}</p>
      <div className="mx-auto mt-6 h-px w-12 bg-white/50" />
      <Names groom={props.groom} bride={props.bride} className="mt-6 font-serif text-5xl leading-none sm:text-6xl" />
      <p className="mt-6 text-xs uppercase tracking-[0.32em] text-white/75">{props.date}</p>
      <GuestBlock {...props} className="mt-4 text-white/85" />
      <OpenButton
        onOpen={props.onOpen}
        opening={props.opening}
        className="mt-8 rounded-full border border-white/45 px-8 py-3 text-xs uppercase tracking-[0.28em]"
      />
    </div>
  )
}

function MarqueeFace(props: FaceProps) {
  return (
    <div className="bg-[#14080e] p-3 text-[#f8efd8] shadow-[0_30px_60px_-32px_rgb(0_0_0/0.8)]">
      <div className="border border-[#f6e27a]/80 px-5 py-8 text-center sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.42em] text-[#f6e27a]">Vé mời</p>
        <Names
          groom={props.groom}
          bride={props.bride}
          className="mt-4 font-sans text-3xl uppercase leading-tight tracking-[0.14em] sm:text-4xl"
        />
        <div className="my-5 border-t border-dashed border-[#f6e27a]/55" />
        <p className="text-sm tracking-[0.22em]">{props.date}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#f6e27a]/80">{props.announcement}</p>
        <GuestBlock {...props} className="mt-4" />
        <OpenButton
          onOpen={props.onOpen}
          opening={props.opening}
          className="mt-6 w-full bg-[#f6e27a] py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1a0c12]"
        />
      </div>
    </div>
  )
}

function TileFace(props: FaceProps) {
  return (
    <div className="grid grid-cols-2 border border-w-line bg-w-bg text-w-strong shadow-[0_18px_40px_-28px_rgb(0_0_0/0.45)]">
      <p className="col-span-2 border-b border-w-line px-4 py-3 text-center text-[11px] uppercase tracking-[0.28em]">{props.announcement}</p>
      <h2 id="cover-title" className="contents">
        <span className="flex min-h-28 items-end border-r border-b border-w-line px-4 py-5 font-serif text-3xl leading-none">{props.groom}</span>
        <span className="sr-only"> và </span>
        <span className="flex min-h-28 items-end border-b border-w-line px-4 py-5 font-serif text-3xl leading-none">{props.bride}</span>
      </h2>
      <p className="flex items-center border-r border-w-line px-4 py-5 text-sm tracking-[0.14em]">{props.date}</p>
      <OpenButton
        onOpen={props.onOpen}
        opening={props.opening}
        className="px-4 py-5 text-left text-xs uppercase tracking-[0.16em]"
      />
      {(props.guestName || props.showInviteLine) && (
        <GuestBlock {...props} className="col-span-2 border-t border-w-line px-4 py-4 text-center" />
      )}
    </div>
  )
}

function CourtFace(props: FaceProps) {
  return (
    <div className="border-2 border-[#e6c36a] p-2 text-center">
      <div className="border border-[#e6c36a]/70 px-6 py-9 sm:px-10">
        <p className="text-5xl text-[#e6c36a]" aria-hidden>
          囍
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.36em] text-[#e6c36a]">{props.announcement}</p>
        <Names groom={props.groom} bride={props.bride} className="mt-5 font-serif text-4xl leading-none sm:text-5xl" />
        <p className="mt-4 text-sm tracking-[0.22em]">{props.date}</p>
        <GuestBlock {...props} className="mt-4" />
        <OpenButton
          onOpen={props.onOpen}
          opening={props.opening}
          className="mt-7 border border-[#e6c36a] px-7 py-3 text-xs uppercase tracking-[0.24em] text-[#e6c36a]"
        />
      </div>
    </div>
  )
}

function TideFace(props: FaceProps) {
  return (
    <div className="overflow-hidden text-center">
      <svg viewBox="0 0 1440 90" className="block w-full text-w-strong/25" aria-hidden preserveAspectRatio="none">
        <path fill="currentColor" d="M0 50c160 36 280-36 460 0s300 36 460 0 280-36 520 0v40H0z" />
      </svg>
      <div className="px-6 pb-8">
        <p className="text-[11px] uppercase tracking-[0.32em]">{props.announcement}</p>
        <Names groom={props.groom} bride={props.bride} className="mt-3 font-serif text-5xl italic leading-[0.95] sm:text-6xl" />
        <p className="mt-4 text-sm tracking-[0.2em]">{props.date}</p>
        <GuestBlock {...props} className="mt-4" />
        <OpenButton
          onOpen={props.onOpen}
          opening={props.opening}
          className="mt-7 rounded-full bg-w-strong px-8 py-3 text-xs uppercase tracking-[0.22em] text-w-bg"
        />
      </div>
    </div>
  )
}

function LanternFace(props: FaceProps) {
  return (
    <div className="px-4 py-2 text-center">
      <div className="mx-auto flex flex-col items-center" aria-hidden>
        <span className="h-5 w-px bg-[#e8a040]" />
        <span className="flex h-20 w-12 items-center justify-center rounded-[1.3rem] bg-[#e8a040] font-serif text-xl text-[#2a1608] shadow-[0_0_22px_rgb(232_160_64/0.45)]">
          囍
        </span>
        <span className="h-3 w-px bg-[#e8a040]" />
      </div>
      <p className="mt-5 text-[11px] uppercase tracking-[0.34em] text-[#e8a040]">{props.announcement}</p>
      <Names groom={props.groom} bride={props.bride} className="mt-3 font-serif text-4xl leading-none sm:text-5xl" />
      <p className="mt-4 text-sm tracking-[0.18em]">{props.date}</p>
      <GuestBlock {...props} className="mt-4" />
      <OpenButton
        onOpen={props.onOpen}
        opening={props.opening}
        className="mt-7 rounded-full border border-[#e8a040] px-8 py-3 text-xs uppercase tracking-[0.22em] text-[#e8a040]"
      />
    </div>
  )
}

function BroadsheetFace(props: FaceProps) {
  return (
    <div className="border-y-2 border-w-strong px-2 py-6 text-center text-w-strong">
      <p className="text-[11px] uppercase tracking-[0.42em]">Báo hỷ</p>
      <p className="mt-3 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">{props.date}</p>
      <div className="mx-auto my-4 h-px w-full bg-w-strong" />
      <Names
        groom={props.groom}
        bride={props.bride}
        className="font-sans text-lg uppercase tracking-[0.16em] sm:text-xl"
      />
      <p className="mt-4 text-sm leading-6">{props.announcement}</p>
      <GuestBlock {...props} className="mt-4" />
      <OpenButton
        onOpen={props.onOpen}
        opening={props.opening}
        className="mt-6 text-xs uppercase tracking-[0.24em] underline underline-offset-4"
      />
    </div>
  )
}

function LedgerFace(props: FaceProps) {
  return (
    <div
      className="cover-letter -rotate-1 bg-[#f7f1e4] px-6 py-8 text-left text-[#243044] shadow-[0_18px_40px_-24px_rgb(29_78_137/0.55)] sm:px-8"
    >
      <p className="font-sans text-sm tracking-[0.16em] text-[#1d4e89]">{props.date}</p>
      <Names groom={props.groom} bride={props.bride} className="mt-8 font-serif text-4xl italic leading-tight sm:text-5xl" />
      <p className="mt-5 text-sm leading-6">{props.announcement}</p>
      <GuestBlock {...props} className="mt-4" />
      <OpenButton
        onOpen={props.onOpen}
        opening={props.opening}
        className="mt-8 text-xs uppercase tracking-[0.22em] text-[#1d4e89] underline underline-offset-4"
      />
    </div>
  )
}

function MosaicFace(props: FaceProps) {
  return (
    <div className="grid grid-cols-2 gap-1 text-w-strong">
      <div className="bg-w-strong px-4 py-6 text-w-bg">
        <p className="text-[10px] uppercase tracking-[0.22em]">{props.announcement}</p>
        <h2 id="cover-title" className="mt-4 font-serif text-3xl leading-none">
          {props.groom}
          <span className="sr-only"> và {props.bride}</span>
        </h2>
      </div>
      <div className="flex items-end border border-w-line px-4 py-6 font-serif text-3xl leading-none">{props.bride}</div>
      <p className="flex items-center border border-w-line px-4 py-5 text-sm tracking-[0.12em]">{props.date}</p>
      <OpenButton
        onOpen={props.onOpen}
        opening={props.opening}
        className="bg-w-strong px-4 py-5 text-left text-xs uppercase tracking-[0.14em] text-w-bg"
      />
      {(props.guestName || props.showInviteLine) && (
        <GuestBlock {...props} className="col-span-2 border border-w-line px-4 py-4" />
      )}
    </div>
  )
}

const FACES: Record<SignatureLayout, (props: FaceProps) => ReactElement> = {
  scroll: ScrollFace,
  constellation: ConstellationFace,
  marquee: MarqueeFace,
  tile: TileFace,
  court: CourtFace,
  tide: TideFace,
  lantern: LanternFace,
  broadsheet: BroadsheetFace,
  ledger: LedgerFace,
  mosaic: MosaicFace,
}

export function SignatureCover({ layout, ...props }: FaceProps & { layout: SignatureLayout }) {
  const Face = FACES[layout]
  return <Face {...props} />
}
