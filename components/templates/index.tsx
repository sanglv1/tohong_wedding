import { isSignatureCard, SignatureCard } from './signature-card'

export type PosterFace = {
  mood: string
  ink: 'light' | 'dark'
  swatch: string
  monogram: string
  groom: string
  bride: string
  date: string
  layout?: string
}

function VeilPoster({ face, compact }: { face: PosterFace; compact: boolean }) {
  return (
    <div
      className={`relative overflow-hidden ${compact ? 'h-[188px]' : 'h-[320px]'}`}
      style={{ background: face.swatch, color: '#4a2c32' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgb(255 255 255 / 0.72), transparent 62%)' }}
      />
      <div className={`pointer-events-none absolute rounded-[1.4rem] border border-[#c9a27a]/70 ${compact ? 'inset-3' : 'inset-4'}`} />
      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        <span className="h-9 w-9 rounded-full border border-[#c9a27a] bg-[radial-gradient(circle_at_35%_30%,#fff,#f3d5c8_58%,#c9a27a)] shadow-[0_0_16px_rgb(243_213_200/0.8)]" />
        <p className={`font-invite leading-none ${compact ? 'mt-3 text-[1.35rem]' : 'mt-5 text-[2.35rem]'}`}>{face.groom}</p>
        <p className="my-1 text-[10px] tracking-[0.42em] text-[#a86b78]">&amp;</p>
        <p className={`font-invite leading-none ${compact ? 'text-[1.35rem]' : 'text-[2.35rem]'}`}>{face.bride}</p>
        {face.date && <p className={`tracking-[0.16em] text-[#8a6a70] ${compact ? 'mt-2 text-[11px]' : 'mt-4 text-sm'}`}>{face.date}</p>}
      </div>
    </div>
  )
}

export function TemplatePoster({ face, compact = false }: { face: PosterFace; compact?: boolean }) {
  if (face.layout === 'veil') return <VeilPoster face={face} compact={compact} />
  if (isSignatureCard(face.layout)) return <SignatureCard face={face} compact={compact} />
  const ink = face.ink === 'light' ? '#f8f1e4' : '#1c1917'
  return (
    <div
      className={compact ? 'relative h-[188px] overflow-hidden' : 'relative h-[320px] overflow-hidden'}
      style={{ background: face.swatch, color: ink }}
    >
      <div className={`pointer-events-none absolute rounded-[1.15rem] border border-current opacity-30 ${compact ? 'inset-2' : 'inset-3'}`} />
      <div className={`pointer-events-none absolute rounded-[0.95rem] border border-current opacity-15 ${compact ? 'inset-3' : 'inset-4'}`} />
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center ${compact ? 'px-3' : 'px-8'}`}>
        <p className="text-[10px] tracking-[0.28em] uppercase opacity-70">{face.mood}</p>
        <span
          className={`flex items-center justify-center rounded-full border border-current/40 font-invite ${compact ? 'mt-2 h-8 w-8 text-sm' : 'mt-5 h-12 w-12 text-lg'}`}
          aria-hidden
        >
          {face.monogram}
        </span>
        <p className={`font-invite leading-none ${compact ? 'mt-2 text-[1.35rem]' : 'mt-5 text-[2.35rem]'}`}>{face.groom}</p>
        <p className={`tracking-[0.42em] opacity-70 ${compact ? 'my-1 text-[9px]' : 'my-2 text-[10px]'}`}>&amp;</p>
        <p className={`font-invite leading-none ${compact ? 'text-[1.35rem]' : 'text-[2.35rem]'}`}>{face.bride}</p>
        {face.date && (
          <p className={`tracking-[0.14em] opacity-80 ${compact ? 'mt-2 text-[11px]' : 'mt-5 text-sm'}`}>{face.date}</p>
        )}
      </div>
    </div>
  )
}
