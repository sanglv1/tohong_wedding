'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Heart, Palette } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { useGuestName } from '@/hooks/use-guest-name'
import { useWeddingTheme } from '@/hooks/use-wedding-theme'
import { WEDDING_OPEN_EVENT } from '@/hooks/use-background-music'
import type { SignatureLayout } from '@/components/signature-heroes'
import { SignatureCover } from '@/components/signature-cover'
import type { OpeningId } from '@/lib/platform/experience'
import { openingDress, PACE_SCALE, type OpeningDress } from '@/lib/platform/opening-dress'

/** closed → opening (dấu sáp tách, nắp lật) → revealing (chớp sáng, hai cánh cửa mở) → hidden */
type Stage = 'closed' | 'opening' | 'revealing' | 'hidden'

const TIMING: Record<Exclude<OpeningId, 'trang'>, { open: number; reveal: number; confetti: boolean }> = {
  'phong-bi': { open: 1150, reveal: 1500, confetti: true },
  'rem-cua': { open: 420, reveal: 1100, confetti: false },
  'anh-sang': { open: 360, reveal: 1000, confetti: false },
  'canh-hoa': { open: 900, reveal: 1300, confetti: true },
}

const loadConfetti = () => import('@/lib/confetti')

type CoverLayout = SignatureLayout | 'veil'

const VEIL_DEW = [
  { left: '14%', top: '22%', delay: '0s' },
  { left: '28%', top: '64%', delay: '1.1s' },
  { left: '46%', top: '18%', delay: '0.4s' },
  { left: '62%', top: '72%', delay: '1.6s' },
  { left: '78%', top: '30%', delay: '0.8s' },
  { left: '88%', top: '54%', delay: '1.9s' },
]

function dressStyle(dress: OpeningDress): CSSProperties {
  return {
    '--open-seal': dress.seal,
    '--open-seal-deep': dress.sealDeep,
    '--open-heart': dress.heart,
    '--open-petal': dress.petal,
    '--open-flash': dress.flash,
  } as CSSProperties
}

function SealPiece({ part }: { part: 'whole' | 'left' | 'right' }) {
  return (
    <div
      className={`cover-seal cover-seal-piece cover-seal-${part} absolute inset-0 rounded-full flex items-center justify-center border-4`}
    >
      <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-sm" aria-hidden />
    </div>
  )
}

export function InvitationCover({
  model = CLASSIC_MODEL,
  allowThemeCycle = true,
  effect = 'phong-bi',
  templateId = 'trang-dat',
  layout,
}: {
  model?: WeddingModel
  allowThemeCycle?: boolean
  effect?: Exclude<OpeningId, 'trang'>
  templateId?: string
  layout?: CoverLayout
}) {
  const WEDDING = model.wedding
  const ANNOUNCEMENT = model.announcement
  const dress = openingDress(templateId)
  const [stage, setStage] = useState<Stage>('closed')
  const guestName = useGuestName()
  const { themeName, cycleTheme } = useWeddingTheme()

  useEffect(() => {
    loadConfetti()
  }, [])

  useEffect(() => {
    if (stage === 'hidden') return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [stage])

  const handleOpen = () => {
    if (stage !== 'closed') return
    setStage('opening')
    // Phát nhạc phải nằm ngay trong thao tác bấm, trình duyệt mới cho phép
    window.dispatchEvent(new Event(WEDDING_OPEN_EVENT))

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timing = layout === 'veil' ? { open: 1100, reveal: 1200, confetti: false } : TIMING[effect]
    const scale = PACE_SCALE[dress.pace]
    setTimeout(() => {
      setStage('revealing')
      document.documentElement.dataset.opened = 'true'
      if (timing.confetti) {
        loadConfetti().then((m) => m.fireOpeningCelebration([dress.seal, dress.sealDeep, dress.petal, dress.flash, '#fffaf3']))
      }
      setTimeout(() => {
        setStage('hidden')
        window.scrollTo({ top: 0 })
      }, reduceMotion ? 0 : timing.reveal * scale)
    }, reduceMotion ? 0 : timing.open * scale)
  }

  if (stage === 'hidden') return null

  const isOpening = stage !== 'closed'
  const signature = layout && layout !== 'veil' ? layout : undefined
  const dateFormatted = WEDDING.dateShort.replace(/\//g, '.')
  const inviteLine = 'Trân trọng kính mời'
  const announcementIsInvite = ANNOUNCEMENT.trim().toLocaleLowerCase('vi') === inviteLine.toLocaleLowerCase('vi')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-title"
      data-stage={stage}
      data-effect={effect}
      data-layout={layout}
      data-pace={dress.pace}
      data-petal={dress.petalShape}
      style={dressStyle(dress)}
      className="cover-root fixed inset-x-0 bottom-0 top-[var(--demo-bar)] z-[100]"
    >
      {effect === 'canh-hoa' && (
        <div className="cover-bloom" aria-hidden>
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} style={{ left: `${6 + (index * 7.5) % 90}%`, animationDelay: `${(index % 6) * 0.08}s` }} />
          ))}
        </div>
      )}
      {layout === 'veil' && (
        <div className="veil-gauze" aria-hidden>
          <span className="veil-gauze-sheet" />
          {VEIL_DEW.map((dew) => (
            <span key={dew.left} className="veil-dew" style={{ left: dew.left, top: dew.top, animationDelay: dew.delay }} />
          ))}
        </div>
      )}
      {layout === 'constellation' && (
        <div className="cover-stars" aria-hidden>
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      )}
      {layout === 'marquee' && <div className="cover-lights" aria-hidden />}
      {layout === 'tide' && (
        <svg className="cover-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0 60c180 40 300-40 480 0s300 40 480 0 300-40 480 0v60H0z" />
        </svg>
      )}
      {layout === 'lantern' && (
        <>
          <span className="cover-lantern cover-lantern-left" aria-hidden />
          <span className="cover-lantern cover-lantern-right" aria-hidden />
        </>
      )}
      <div className="cover-door cover-door-left" aria-hidden />
      <div className="cover-door cover-door-right" aria-hidden />
      <div className="cover-flash" aria-hidden />

      {allowThemeCycle && (
        <button
          type="button"
          onClick={cycleTheme}
          className="cover-palette absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-white/50 flex items-center justify-center text-stone-600 hover:text-stone-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label={`Đổi màu nền (hiện: ${themeName})`}
          title={`Đổi màu (${themeName})`}
        >
          <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className={`cover-card-wrap perspective-[1200px] w-full ${layout === 'tide' || layout === 'broadsheet' ? 'max-w-xl' : 'max-w-[420px]'}`}>
            {signature ? (
              <SignatureCover
                layout={signature}
                announcement={ANNOUNCEMENT}
                groom={WEDDING.groomShort}
                bride={WEDDING.brideShort}
                date={dateFormatted}
                guestName={guestName ?? ''}
                inviteLine={inviteLine}
                showInviteLine={!announcementIsInvite}
                opening={isOpening}
                onOpen={handleOpen}
              />
            ) : (
            <div className="envelope-card relative w-full">
              <div className="cover-gold-frame absolute -inset-[1px] rounded-[2rem] opacity-90" />
              <div className="cover-inner-border absolute -inset-[2px] rounded-[1.5rem] m-[3px]" />

              <div className="relative w-full h-full rounded-[1.25rem] overflow-hidden">
                <div className="cover-surface relative pt-[7.5rem] sm:pt-[8.75rem] pb-10 px-8 sm:px-12 text-center rounded-b-[1.25rem]">
                  <div className="cover-letter cover-stagger">
                    <p className="cover-sub text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-4 font-light leading-relaxed">
                      {ANNOUNCEMENT}
                    </p>
                    <h2
                      id="cover-title"
                      className="cover-text font-serif text-[1.75rem] sm:text-4xl font-bold tracking-wide mb-6 flex flex-nowrap items-center justify-center gap-x-2 sm:gap-x-3"
                    >
                      <span className="whitespace-nowrap drop-shadow-sm">{WEDDING.groomShort}</span>
                      <Heart
                        className="cover-accent w-5 h-5 sm:w-7 sm:h-7 fill-current shrink-0 drop-shadow-sm"
                        aria-hidden
                      />
                      <span className="sr-only">và</span>
                      <span className="whitespace-nowrap drop-shadow-sm">{WEDDING.brideShort}</span>
                    </h2>

                    <div className="flex items-center justify-center gap-3 mb-6" aria-hidden>
                      <span className="cover-line-left w-8 h-px opacity-70" />
                      <span className="cover-accent-bg w-2 h-2 rounded-full" />
                      <span className="cover-accent-bg w-16 h-px opacity-80" />
                      <span className="cover-accent-bg w-2 h-2 rounded-full" />
                      <span className="cover-line-right w-8 h-px opacity-70" />
                    </div>

                    <p className={`cover-date font-serif text-xl sm:text-2xl tracking-[0.2em] ${guestName || !announcementIsInvite ? 'mb-2' : 'mb-10'}`}>
                      {dateFormatted}
                    </p>

                    {guestName ? (
                      <div className="mb-8">
                        {!announcementIsInvite && (
                          <p className="cover-date text-xs uppercase tracking-[0.3em] font-light mb-2">{inviteLine}</p>
                        )}
                        <p className="cover-text font-serif text-2xl sm:text-3xl break-words">{guestName}</p>
                      </div>
                    ) : (
                      !announcementIsInvite && (
                        <p className="cover-date text-xs uppercase tracking-[0.35em] mb-10 font-light">{inviteLine}</p>
                      )
                    )}

                    <button
                      type="button"
                      onClick={handleOpen}
                      disabled={isOpening}
                      autoFocus
                      className="cover-btn relative overflow-hidden w-full py-4 font-bold text-sm uppercase tracking-[0.25em] rounded-xl shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-90 disabled:cursor-not-allowed border focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      Mở thiệp cưới
                    </button>
                  </div>
                </div>

                <div className="envelope-flap cover-surface absolute top-0 left-0 right-0 h-20 sm:h-24 rounded-t-[1.25rem] rounded-b-[2rem]" />
              </div>

              <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 -translate-y-[42%] z-10" aria-hidden>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                  <div className="cover-seal-glow absolute -inset-6 rounded-full opacity-60" />
                  <span className="cover-seal-ring absolute inset-0 rounded-full" />
                  <SealPiece part="left" />
                  <SealPiece part="right" />
                  <SealPiece part="whole" />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
