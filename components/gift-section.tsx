'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Copy, Gift, Hand, RotateCcw } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { GiftId } from '@/lib/platform/experience'
import type { WeddingModel } from '@/lib/wedding-model'
import { isOptimizableImage } from '@/lib/media-src'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

type GiftAccount = WeddingModel['gift']['groom']
type EnvelopeStage = 'closed' | 'opening' | 'open'
type SharedGiftId = 'hop' | 'thung' | 'tui' | 'tim'

/** Thời gian nắp lật trước khi hiện thẻ tài khoản */
const OPEN_DURATION = 1150

const GIFT_COPY: Record<GiftId, { hint: string; lead: string; close: string; label: string }> = {
  'phong-bi': {
    hint: 'Chạm phong bì để mở',
    lead: 'Mỗi người một phong bì. Mở ra để xem mã QR và số tài khoản.',
    close: 'Gấp lại',
    label: 'phong bì',
  },
  hop: {
    hint: 'Chạm nắp hộp quà',
    lead: 'Một hộp quà cho cả hai. Chạm nắp để xem tài khoản chú rể và cô dâu.',
    close: 'Đậy hộp',
    label: 'hộp quà',
  },
  thung: {
    hint: 'Chạm khóa thùng',
    lead: 'Thùng nhận quà. Chạm khóa, nắp mở, hiện tài khoản của hai bạn.',
    close: 'Đóng thùng',
    label: 'thùng quà',
  },
  tui: {
    hint: 'Chạm dây túi lụa',
    lead: 'Túi lụa thắt dây. Kéo dây để xem tài khoản chú rể và cô dâu.',
    close: 'Thắt túi',
    label: 'túi lụa',
  },
  tim: {
    hint: 'Chạm hộp tim',
    lead: 'Hộp tim mở ra là tài khoản chú rể và cô dâu.',
    close: 'Khép lại',
    label: 'hộp tim',
  },
  the: {
    hint: 'Chạm để lật thẻ',
    lead: 'Lật thẻ mừng để xem mã QR và số tài khoản.',
    close: 'Úp thẻ',
    label: 'thẻ',
  },
  keo: {
    hint: 'Chạm nơ ruy băng',
    lead: 'Kéo nơ để mở quà và xem thông tin chuyển khoản.',
    close: 'Buộc lại',
    label: 'gói quà',
  },
  mo: {
    hint: '',
    lead: 'Mã mừng hiện sẵn. Tiền đi thẳng vào tài khoản của hai bạn.',
    close: '',
    label: 'thẻ mừng',
  },
}

function isSharedGift(style: GiftId): style is SharedGiftId {
  return style === 'hop' || style === 'thung' || style === 'tui' || style === 'tim'
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  }
}

function CopyAccountButton({ accountNumber }: { accountNumber: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async () => {
    if (!(await copyText(accountNumber.replace(/\s/g, '')))) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-w-line bg-w-tint px-3 py-1.5 text-xs font-medium text-w-strong hover:border-w-line-strong transition-colors"
      aria-live="polite"
    >
      {copied ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
      {copied ? 'Đã sao chép' : 'Sao chép số tài khoản'}
    </button>
  )
}

function useUnwrap(initiallyOpen = false) {
  const [stage, setStage] = useState<EnvelopeStage>(initiallyOpen ? 'open' : 'closed')
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const focusOnOpen = useRef(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (stage === 'open' && focusOnOpen.current) {
      focusOnOpen.current = false
      panelRef.current?.focus({ preventScroll: true })
    }
  }, [stage])

  const unwrap = () => {
    if (stage !== 'closed') return
    focusOnOpen.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('open')
      return
    }
    setStage('opening')
    const rect = anchorRef.current?.getBoundingClientRect()
    timer.current = setTimeout(() => {
      setStage('open')
      if (!rect) return
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height * 0.35) / window.innerHeight
      import('@/lib/confetti').then(({ fireGiftBurst }) => fireGiftBurst(x, y))
    }, OPEN_DURATION)
  }

  return { stage, anchorRef, panelRef, unwrap, close: () => setStage('closed') }
}

function AccountCard({
  account,
  fullName,
  onQRClick,
}: {
  account: GiftAccount
  fullName: string
  onQRClick: () => void
}) {
  return (
    <div className="gift-note gift-reveal w-full bg-w-qr rounded-2xl p-6 sm:p-8 border-2 border-w-gold text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-w-muted mb-3">{account.name}</p>
      {account.qrPath && (
        <button
          type="button"
          onClick={onQRClick}
          className="relative block w-40 h-40 bg-white rounded-lg overflow-hidden mx-auto mb-4 p-2 hover:ring-2 hover:ring-w-gold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-w-gold cursor-zoom-in"
          aria-label={`Phóng to mã QR của ${fullName}`}
        >
          <Image
            src={account.qrPath}
            alt={`Mã QR chuyển khoản của ${fullName}`}
            fill
            className="object-contain"
            sizes="160px"
            unoptimized={!isOptimizableImage(account.qrPath)}
          />
        </button>
      )}
      <h3 className="text-lg font-semibold text-w-strong mb-2">{fullName}</h3>
      <div className="space-y-0.5 text-sm text-w-text">
        {account.bankName && <p className="font-medium">{account.bankName}</p>}
        {account.accountNumber && <p className="font-mono text-base tracking-wider">{account.accountNumber}</p>}
        {account.accountName && <p className="text-xs uppercase text-w-muted">{account.accountName}</p>}
      </div>
      {account.accountNumber && <CopyAccountButton accountNumber={account.accountNumber} />}
    </div>
  )
}

function CloseRow({ label, onClose }: { label: string; onClose: () => void }) {
  if (!label) return null
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1 text-xs text-w-muted hover:text-w-strong underline-offset-2 hover:underline"
      >
        <RotateCcw className="w-3 h-3" aria-hidden />
        {label}
      </button>
    </div>
  )
}

function Hint({ text, hidden }: { text: string; hidden: boolean }) {
  if (!text) return null
  return (
    <p className={`mt-5 inline-flex items-center gap-1.5 text-sm text-w-muted transition-opacity ${hidden ? 'opacity-0' : ''}`}>
      <Hand className="w-4 h-4 gift-hint-icon" aria-hidden />
      {text}
    </p>
  )
}

function Bow() {
  return (
    <span className="gx-bow" aria-hidden>
      <span className="gx-loop gx-loop-l" />
      <span className="gx-loop gx-loop-r" />
      <span className="gx-tail gx-tail-l" />
      <span className="gx-tail gx-tail-r" />
      <span className="gx-knot" />
    </span>
  )
}

function Coins() {
  return (
    <span className="gx-coins" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  )
}

function GiftTag({ title, who, tone, place = 'lower' }: { title: string; who: string; tone: 'light' | 'dark'; place?: 'lower' | 'mid' }) {
  return (
    <span className={`gx-tag gx-tag-${tone} ${place === 'mid' ? 'gx-tag-mid' : ''}`}>
      <span className="gx-mark" aria-hidden>
        囍
      </span>
      <span className="gx-script">{title}</span>
      <span className="gx-who">{who}</span>
    </span>
  )
}

function PresentFace({ who }: { who: string }) {
  return (
    <span className="gx-present">
      <span className="gx-present-shadow" aria-hidden />
      <Coins />
      <span className="gx-present-body" aria-hidden>
        <span className="gx-ribbon gx-ribbon-v" />
        <span className="gx-ribbon gx-ribbon-h" />
        <GiftTag title="Hộp quà" who={who} tone="light" />
      </span>
      <span className="gx-lid">
        <span className="gx-lid-face">
          <span className="gx-sheen" />
        </span>
        <Bow />
      </span>
    </span>
  )
}

function ChestFace({ who }: { who: string }) {
  return (
    <span className="gx-chest">
      <span className="gx-present-shadow" aria-hidden />
      <Coins />
      <span className="gx-chest-glow" aria-hidden />
      <span className="gx-chest-body">
        <span className="gx-band gx-band-top" aria-hidden />
        <span className="gx-band gx-band-bot" aria-hidden />
        <GiftTag title="Thùng mừng" who={who} tone="dark" place="mid" />
      </span>
      <span className="gx-chest-lid">
        <span className="gx-chest-lid-face">
          <span className="gx-band gx-band-lid" aria-hidden />
          <span className="gx-sheen" />
        </span>
        <span className="gx-clasp" aria-hidden />
      </span>
    </span>
  )
}

function PouchFace({ who }: { who: string }) {
  return (
    <span className="gx-pouch block">
      <span className="gx-cord gx-cord-l" aria-hidden />
      <span className="gx-cord gx-cord-r" aria-hidden />
      <span className="gx-pouch-knot" aria-hidden />
      <span className="gx-pouch-body">
        <span className="gx-pouch-mouth" aria-hidden />
        <span className="gx-pouch-copy">
          <span className="gx-mark" aria-hidden>
            囍
          </span>
          <span className="gx-script">Túi lụa</span>
          <span className="gx-who">{who}</span>
        </span>
      </span>
    </span>
  )
}

function HeartFace({ who }: { who: string }) {
  const rawId = useId()
  const fillId = `gx-heart-${rawId.replace(/:/g, '')}`
  return (
    <span className="gx-heart">
      <svg className="gx-heart-svg" viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fecdd3" />
            <stop offset="0.42" stopColor="#e11d48" />
            <stop offset="1" stopColor="#9f1239" />
          </linearGradient>
        </defs>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={`url(#${fillId})`}
          stroke="#f8e7b0"
          strokeWidth="0.45"
        />
      </svg>
      <span className="gx-heart-copy">
        <span className="gx-mark" aria-hidden>
          囍
        </span>
        <span className="gx-script">Hộp tim</span>
        <span className="gx-who">{who}</span>
      </span>
    </span>
  )
}

function CardFace({ who, role }: { who: string; role: string }) {
  return (
    <span className="gx-card-face">
      <span className="gx-corner gx-corner-tl" aria-hidden />
      <span className="gx-corner gx-corner-tr" aria-hidden />
      <span className="gx-corner gx-corner-bl" aria-hidden />
      <span className="gx-corner gx-corner-br" aria-hidden />
      <span className="gx-sheen" aria-hidden />
      <span className="gx-mark">囍</span>
      <span className="gx-script">Mừng cưới</span>
      <span className="gx-who">{who}</span>
      <span className="gx-role">{role}</span>
    </span>
  )
}

function ParcelFace({ who }: { who: string }) {
  return (
    <span className="gx-parcel-box">
      <span className="gx-paper">
        <GiftTag title="Mừng cưới" who={who} tone="light" />
      </span>
      <span className="gx-ribbon gx-ribbon-v" aria-hidden />
      <span className="gx-ribbon gx-ribbon-h" aria-hidden />
      <Bow />
    </span>
  )
}

function sideHasDetail(account: GiftAccount) {
  return Boolean(account.qrPath || account.accountNumber || account.bankName || account.accountName)
}

function CoupleGift({
  style,
  groom,
  bride,
  onZoom,
}: {
  style: SharedGiftId
  groom: { account: GiftAccount; fullName: string; shortName: string }
  bride: { account: GiftAccount; fullName: string; shortName: string }
  onZoom: (account: GiftAccount, fullName: string) => void
}) {
  const { stage, anchorRef, panelRef, unwrap, close } = useUnwrap()
  const copy = GIFT_COPY[style]
  const who = `${groom.shortName} & ${bride.shortName}`
  const sides = [groom, bride].filter((side) => sideHasDetail(side.account))
  const openLabel = `Mở ${copy.label} để xem tài khoản của ${groom.fullName} và ${bride.fullName}`

  return (
    <Reveal delay={120} className="flex flex-col items-center">
      {stage !== 'open' ? (
        <div className="flex w-full flex-col items-center pt-2">
          <button
            ref={anchorRef}
            type="button"
            onClick={unwrap}
            disabled={stage === 'opening'}
            className={`gx-hit gx-${style} ${stage === 'opening' ? 'is-open' : ''}`}
            aria-label={openLabel}
          >
            {style === 'thung' ? (
              <ChestFace who={who} />
            ) : style === 'tui' ? (
              <PouchFace who={who} />
            ) : style === 'tim' ? (
              <HeartFace who={who} />
            ) : (
              <PresentFace who={who} />
            )}
          </button>
          <Hint text={copy.hint} hidden={stage === 'opening'} />
        </div>
      ) : (
        <div ref={panelRef} tabIndex={-1} className="w-full focus:outline-none">
          <div className={`grid gap-6 ${sides.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-md'}`}>
            {sides.map((side) => (
              <AccountCard
                key={side.account.name}
                account={side.account}
                fullName={side.fullName}
                onQRClick={() => onZoom(side.account, side.fullName)}
              />
            ))}
          </div>
          <CloseRow label={copy.close} onClose={close} />
        </div>
      )}
    </Reveal>
  )
}

function PersonGift({
  account,
  fullName,
  shortName,
  delay,
  style,
  onQRClick,
}: {
  account: GiftAccount
  fullName: string
  shortName: string
  delay: number
  style: GiftId
  onQRClick: () => void
}) {
  const { stage, anchorRef, panelRef, unwrap, close } = useUnwrap(style === 'mo')
  const copy = GIFT_COPY[style]
  const openLabel = `Mở ${copy.label} của ${account.name.toLowerCase()} ${fullName} để xem ${account.qrPath ? 'mã QR' : 'số tài khoản'}`

  return (
    <Reveal delay={delay} className="flex flex-col items-center">
      {stage !== 'open' ? (
        <div className="flex w-full flex-col items-center pt-6 sm:pt-8">
          {style === 'the' ? (
            <button
              ref={anchorRef}
              type="button"
              onClick={unwrap}
              disabled={stage === 'opening'}
              className={`gx-hit gx-card ${stage === 'opening' ? 'is-open' : ''}`}
              aria-label={openLabel}
            >
              <CardFace who={shortName} role={account.name} />
            </button>
          ) : style === 'keo' ? (
            <button
              ref={anchorRef}
              type="button"
              onClick={unwrap}
              disabled={stage === 'opening'}
              className={`gx-hit gx-parcel ${stage === 'opening' ? 'is-open' : ''}`}
              aria-label={openLabel}
            >
              <ParcelFace who={shortName} />
            </button>
          ) : (
            <button
              ref={anchorRef}
              type="button"
              onClick={unwrap}
              disabled={stage === 'opening'}
              className={`gift-env ${stage === 'opening' ? 'is-open' : ''}`}
              aria-label={openLabel}
            >
              <span className="gift-env-back" aria-hidden />
              <span className="gift-env-letter" aria-hidden>
                <span className="gift-env-letter-mark">囍</span>
                <span className="gift-env-letter-text">{account.qrPath ? 'Mã QR mừng cưới' : 'Số tài khoản'}</span>
              </span>
              <span className="gift-env-pocket" aria-hidden>
                <span className="gift-env-title">Mừng cưới</span>
                <span className="gift-env-name">
                  {account.name} · {shortName}
                </span>
              </span>
              <span className="gift-env-flap" aria-hidden />
              <span className="gift-env-seal" aria-hidden>
                囍
              </span>
            </button>
          )}
          <Hint text={copy.hint} hidden={stage === 'opening'} />
        </div>
      ) : (
        <div ref={panelRef} tabIndex={-1} className="w-full focus:outline-none">
          <AccountCard account={account} fullName={fullName} onQRClick={onQRClick} />
          {style !== 'mo' && <CloseRow label={copy.close} onClose={close} />}
        </div>
      )}
    </Reveal>
  )
}

export function GiftSection({ model = CLASSIC_MODEL, style = 'phong-bi' }: { model?: WeddingModel; style?: GiftId }) {
  const [zoomed, setZoomed] = useState<{ account: GiftAccount; fullName: string } | null>(null)
  const WEDDING = model.wedding
  const GIFT_QR = model.gift

  if (!model.hasGift) return null

  const groom = { account: GIFT_QR.groom, fullName: WEDDING.groom, shortName: WEDDING.groomShort }
  const bride = { account: GIFT_QR.bride, fullName: WEDDING.bride, shortName: WEDDING.brideShort }

  return (
    <>
      <section id="hop-mung" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="section-frame">
            <SectionHeading icon={<Gift className="w-7 h-7" aria-hidden />} description={GIFT_COPY[style].lead}>
              Hộp mừng cưới
            </SectionHeading>

            {isSharedGift(style) ? (
              <CoupleGift
                style={style}
                groom={groom}
                bride={bride}
                onZoom={(account, fullName) => setZoomed({ account, fullName })}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-10 sm:gap-8 items-start">
                <PersonGift
                  account={groom.account}
                  fullName={groom.fullName}
                  shortName={groom.shortName}
                  delay={100}
                  style={style}
                  onQRClick={() => setZoomed({ account: groom.account, fullName: groom.fullName })}
                />
                <PersonGift
                  account={bride.account}
                  fullName={bride.fullName}
                  shortName={bride.shortName}
                  delay={200}
                  style={style}
                  onQRClick={() => setZoomed({ account: bride.account, fullName: bride.fullName })}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog open={zoomed !== null} onOpenChange={(open) => !open && setZoomed(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md w-full p-6 bg-white text-stone-900 rounded-2xl">
          <DialogTitle className="text-lg font-serif font-semibold text-center">
            {zoomed ? `${zoomed.account.name} - ${zoomed.fullName}` : 'Mã QR'}
          </DialogTitle>
          {zoomed && (
            <div className="text-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto bg-white rounded-xl border-2 border-stone-200 p-4">
                <Image
                  src={zoomed.account.qrPath}
                  alt={`Mã QR chuyển khoản của ${zoomed.fullName}`}
                  fill
                  className="object-contain"
                  sizes="320px"
                  unoptimized={!isOptimizableImage(zoomed.account.qrPath)}
                />
              </div>
              <DialogDescription className="text-stone-600 text-sm mt-4">
                {zoomed.account.bankName} · <span className="font-mono">{zoomed.account.accountNumber}</span>
                <br />
                Quét mã bằng ứng dụng ngân hàng
              </DialogDescription>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
