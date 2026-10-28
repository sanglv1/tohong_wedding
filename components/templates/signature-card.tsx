import type { PosterFace } from './index'

const SIGNATURE = new Set(['scroll', 'constellation', 'marquee', 'tile', 'court', 'tide', 'lantern', 'broadsheet', 'ledger', 'mosaic'])

export function isSignatureCard(layout?: string) {
  return Boolean(layout && SIGNATURE.has(layout))
}

export function SignatureCard({ face, compact }: { face: PosterFace; compact: boolean }) {
  const ink = face.ink === 'light' ? '#f8f1e4' : '#1c1917'
  const height = compact ? 'h-[188px]' : 'h-[320px]'
  const name = compact ? 'text-lg' : 'text-3xl'
  const shell = `relative ${height} overflow-hidden`
  const style = { background: face.swatch, color: ink }

  if (face.layout === 'scroll') {
    return (
      <div className={`${shell} px-3 py-2`} style={style}>
        <div className="mx-auto h-2 w-[90%] rounded-full bg-[#2a2118]" />
        <div className="mx-auto mt-1 flex h-[calc(100%-1.25rem)] items-center justify-between border-x border-current/30 px-3">
          <p className="font-invite text-2xl leading-none" style={{ writingMode: 'vertical-rl' }}>
            {face.groom}
          </p>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8b1e1e] text-sm text-[#f8e7c8]">囍</span>
          <p className="font-invite text-2xl leading-none" style={{ writingMode: 'vertical-rl' }}>
            {face.bride}
          </p>
        </div>
      </div>
    )
  }

  if (face.layout === 'constellation') {
    return (
      <div className={`${shell} flex flex-col items-center justify-center text-center`} style={style}>
        <span className="h-8 w-8 rounded-full border border-current/50" />
        <p className={`mt-3 font-invite leading-none ${name}`}>{face.groom}</p>
        <span className="my-2 h-px w-8 bg-current opacity-60" />
        <p className={`font-invite leading-none ${name}`}>{face.bride}</p>
      </div>
    )
  }

  if (face.layout === 'marquee') {
    return (
      <div className={`${shell} flex flex-col justify-between p-2 text-center`} style={{ background: '#1a0c12', color: '#f8efd8' }}>
        <span className="h-1.5 bg-[radial-gradient(circle,#f6e27a_40%,transparent_42%)] bg-[length:12px_6px]" />
        <div>
          <p className="text-[9px] tracking-[0.35em] text-[#e8c56b] uppercase">{face.mood}</p>
          <p className={`mt-1 font-sans leading-none font-semibold uppercase ${name}`}>{face.groom}</p>
          <p className={`font-sans leading-none font-semibold uppercase ${name}`}>{face.bride}</p>
        </div>
        <span className="h-1.5 bg-[radial-gradient(circle,#f6e27a_40%,transparent_42%)] bg-[length:12px_6px]" />
      </div>
    )
  }

  if (face.layout === 'tile') {
    return (
      <div
        className={`${shell} flex flex-col items-center justify-center text-center`}
        style={{
          ...style,
          backgroundImage:
            'linear-gradient(45deg, rgb(196 92 62 / 0.35) 25%, transparent 25%), linear-gradient(-45deg, rgb(30 26 58 / 0.2) 25%, transparent 25%)',
          backgroundSize: '16px 16px',
        }}
      >
        <span className="h-10 w-10 rotate-45 border-2 border-current" />
        <p className={`mt-3 font-invite leading-none ${name}`}>{face.groom}</p>
        <p className={`font-invite leading-none ${name}`}>{face.bride}</p>
      </div>
    )
  }

  if (face.layout === 'court') {
    return (
      <div className={`${shell} p-2 text-center`} style={style}>
        <div className="flex h-full flex-col items-center justify-center border border-[#e6c36a]">
          <p className="text-2xl text-[#e6c36a]">囍</p>
          <p className={`mt-1 font-invite leading-none ${name}`}>{face.groom}</p>
          <p className={`font-invite leading-none ${name}`}>{face.bride}</p>
        </div>
      </div>
    )
  }

  if (face.layout === 'tide') {
    return (
      <div className={`${shell} flex flex-col justify-end text-center`} style={style}>
        <p className={`font-invite leading-none italic ${name}`}>{face.groom}</p>
        <p className={`font-invite leading-none italic ${name}`}>{face.bride}</p>
        <svg viewBox="0 0 1440 80" className="mt-3 h-8 w-full" aria-hidden>
          <path fill="currentColor" d="M0 30c160 28 280-28 440 0s280 28 440 0 280-28 440 0 200 20 120 20v30H0z" />
        </svg>
      </div>
    )
  }

  if (face.layout === 'lantern') {
    return (
      <div className={`${shell} flex items-center justify-center gap-3`} style={style}>
        <span className="h-10 w-6 rounded-full bg-[#e8a040]" />
        <div className="text-center">
          <span className="mx-auto block h-9 w-9 rounded-full border-2 border-[#e8a040]" />
          <p className={`mt-2 font-invite leading-none ${name}`}>{face.groom}</p>
          <p className={`font-invite leading-none ${name}`}>{face.bride}</p>
        </div>
        <span className="h-10 w-6 rounded-full bg-[#e8a040]" />
      </div>
    )
  }

  if (face.layout === 'broadsheet') {
    return (
      <div className={`${shell} flex flex-col justify-center border-y-4 border-double border-current px-3 text-center`} style={style}>
        <p className="font-sans text-[9px] tracking-[0.4em] uppercase">Báo hỷ</p>
        <p className="mt-1 font-sans text-2xl leading-none font-black">{face.date || face.mood}</p>
        <p className="mt-2 border-t border-current pt-2 font-sans text-[11px] tracking-wide uppercase">
          {face.groom} · {face.bride}
        </p>
      </div>
    )
  }

  if (face.layout === 'ledger') {
    return (
      <div
        className={`${shell} flex flex-col justify-center px-4`}
        style={{
          ...style,
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 1.15rem, rgb(29 78 137 / 0.35) 1.2rem)',
        }}
      >
        <p className={`font-invite leading-none ${name}`}>{face.groom}</p>
        <p className={`font-invite leading-none ${name}`}>{face.bride}</p>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-[#1d4e89] uppercase">{face.date}</p>
      </div>
    )
  }

  return (
    <div className={`${shell} grid grid-cols-5 grid-rows-4 gap-1 p-1.5`} style={style}>
      <div className="col-span-3 row-span-4 bg-current/15" />
      <div className="col-span-2 row-span-2 flex items-end bg-current p-1.5" style={{ color: ink }}>
        <span className="text-[11px] leading-none font-semibold" style={{ color: face.ink === 'light' ? '#1c1917' : '#f8f1e4' }}>
          {face.groom}
        </span>
      </div>
      <div className="col-span-2 row-span-2 flex items-end border border-current p-1.5 text-[11px] leading-none font-semibold">{face.bride}</div>
    </div>
  )
}
