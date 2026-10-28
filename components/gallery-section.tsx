'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Images, Maximize2, Pause, Play } from 'lucide-react'
import type { GalleryImage } from '@/lib/gallery'
import type { AlbumId } from '@/lib/platform/experience'
import { WEDDING } from '@/lib/constants'
import { isOptimizableImage } from '@/lib/media-src'
import { GalleryLightbox } from './gallery-lightbox'
import { SlideProgress } from './gallery-progress'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const SLIDE_INTERVAL = 5000
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
/** Vòng xoay 3D cần ít nhất chừng này ảnh mới thành vòng tròn */
const RING_MIN_IMAGES = 3

function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback)
  return () => document.removeEventListener('visibilitychange', callback)
}

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const pad = (n: number) => String(n).padStart(2, '0')
const mod = (n: number, m: number) => ((n % m) + m) % m

function orientation(ratio?: number) {
  if (!ratio) return 'landscape'
  if (ratio < 0.9) return 'portrait'
  if (ratio > 1.2) return 'landscape'
  return 'square'
}

export function GallerySection({
  images,
  brand = { groom: WEDDING.groomBrand, bride: WEDDING.brideBrand, date: WEDDING.dateShort },
  mode = 'tu-dong',
}: {
  images: GalleryImage[]
  brand?: { groom: string; bride: string; date: string }
  mode?: AlbumId
}) {
  const total = images.length
  // Đếm số bước đã xoay (không giới hạn) để vòng 3D luôn quay tiếp theo chiều ngắn nhất, không quay ngược cả vòng
  const [turn, setTurn] = useState(0)
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null)
  const [hovered, setHovered] = useState(false)
  const [inView, setInView] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const active = total ? mod(turn, total) : 0

  const pageVisible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )

  // Người dùng chọn giảm chuyển động thì mặc định không tự chạy, vẫn bật được bằng nút Play
  const playing = total > 1 && (userPlaying ?? !reducedMotion)
  const running = playing && !hovered && inView && pageVisible && lightboxIndex === null

  const goTo = useCallback(
    (i: number) =>
      setTurn((t) => {
        let delta = mod(i - t, total)
        if (delta > total / 2) delta -= total
        return t + delta
      }),
    [total],
  )
  const goNext = useCallback(() => setTurn((t) => t + 1), [])
  const goPrev = useCallback(() => setTurn((t) => t - 1), [])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.35,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    const thumb = strip?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    if (!strip || !thumb) return
    strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  const onStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev()
    if (e.key === 'ArrowRight') goNext()
  }

  if (total === 0) return null
  const current = images[active]
  const mostlyPortrait = images.filter((image) => orientation(image.ratio) === 'portrait').length > total / 2
  const portraitAlbum = mode === 'truot' ? false : mode === 'vong' ? true : mostlyPortrait
  const ring = (mode === 'vong' || (mode === 'tu-dong' && mostlyPortrait)) && total >= RING_MIN_IMAGES
  const mosaic = mode === 'luoi'
  const stack = mode === 'xep'
  const film = mode === 'phim'

  const stageProps = {
    ref: stageRef,
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-label': 'Trình chiếu ảnh cưới',
    tabIndex: 0,
    onKeyDown: onStageKeyDown,
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && setHovered(true),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === 'mouse' && setHovered(false),
    onTouchStart,
    onTouchEnd,
  }

  const playButton = total > 1 && (
    <button
      type="button"
      onClick={() => setUserPlaying(!playing)}
      className="gallery-icon-btn"
      aria-label={playing ? 'Dừng tự chuyển ảnh' : 'Tự chuyển ảnh'}
      aria-pressed={playing}
    >
      {playing ? <Pause className="w-4 h-4" aria-hidden /> : <Play className="w-4 h-4" aria-hidden />}
    </button>
  )

  const zoomButton = (
    <button type="button" onClick={() => setLightboxIndex(active)} className="gallery-icon-btn" aria-label="Xem toàn màn hình">
      <Maximize2 className="w-4 h-4" aria-hidden />
    </button>
  )

  const navButtons = (hideUntilHover: boolean) =>
    total > 1 && (
      <>
        <button
          type="button"
          onClick={goPrev}
          className={`gallery-nav z-[2] left-3 sm:left-5 ${hideUntilHover ? 'sm:opacity-0 sm:group-hover/stage:opacity-100 sm:focus-visible:opacity-100' : ''}`}
          aria-label="Ảnh trước"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={goNext}
          className={`gallery-nav z-[2] right-3 sm:right-5 ${hideUntilHover ? 'sm:opacity-0 sm:group-hover/stage:opacity-100 sm:focus-visible:opacity-100' : ''}`}
          aria-label="Ảnh sau"
        >
          <ChevronRight className="w-6 h-6" aria-hidden />
        </button>
      </>
    )

  const progressBars = total > 1 && (
    <div className="flex gap-1.5" aria-hidden>
      {images.map((image, i) => (
        <span key={image.src + i} className="gallery-progress-track">
          {i < active && <span className="gallery-progress-done" />}
          {i === active && (
            <SlideProgress
              slideKey={turn}
              duration={SLIDE_INTERVAL}
              running={running}
              onDone={goNext}
              className={playing ? '' : 'is-static'}
            />
          )}
        </span>
      ))}
    </div>
  )

  const ringStage = (
    <>
      <div
        {...stageProps}
        className="gallery-ring-stage group/stage relative select-none touch-pan-y"
        style={{ '--n': total, '--turn': turn } as React.CSSProperties}
      >
        <div className="gallery-ring-floor" aria-hidden />
        <div className="gallery-ring">
          {images.map((image, i) => (
            <button
              key={image.src + i}
              type="button"
              className={`gallery-ring-card ${i === active ? 'is-active' : ''}`}
              style={{ '--i': i } as React.CSSProperties}
              onClick={() => (i === active ? setLightboxIndex(i) : goTo(i))}
              tabIndex={i === active ? 0 : -1}
              aria-label={i === active ? `Phóng to ảnh ${i + 1}` : `Xem ảnh ${i + 1}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={i === 0}
                className="object-cover"
                style={image.focus ? { objectPosition: image.focus } : undefined}
                unoptimized={!isOptimizableImage(image.src)}
              />
            </button>
          ))}
        </div>
        {navButtons(false)}
      </div>

      <div className="gallery-ring-panel mx-auto max-w-md">
        <div className="flex items-center gap-3">
          {playButton}
          <div key={active} className="gallery-caption min-w-0 flex-1 text-center">
            <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.3em] text-w-muted whitespace-nowrap">
              {brand.groom} &amp; {brand.bride} · {brand.date}
            </p>
            <p className="font-serif text-2xl sm:text-3xl leading-tight text-w-strong line-clamp-1">
              {current.caption ?? 'Khoảnh khắc yêu thương'}
            </p>
          </div>
          {zoomButton}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">{progressBars}</div>
          <p className="shrink-0 tabular-nums tracking-[0.2em] text-sm text-w-text" aria-live="polite">
            <span className="font-semibold">{pad(active + 1)}</span>
            <span className="text-w-muted"> / {pad(total)}</span>
          </p>
        </div>
      </div>
    </>
  )

  const slideStage = (
    <div
      {...stageProps}
      className={`gallery-stage group/stage relative select-none touch-pan-y ${
        portraitAlbum ? 'aspect-[3/4] max-w-md mx-auto' : 'aspect-[4/5] sm:aspect-[16/10]'
      }`}
      data-album={portraitAlbum ? 'portrait' : 'landscape'}
    >
      {images.map((image, i) => (
        <div
          key={image.src + i}
          className={`gallery-layer ${i === active ? 'is-active' : ''}`}
          data-orient={orientation(image.ratio)}
          aria-hidden={i !== active}
        >
          <Image src={image.src} alt="" fill className="gallery-backdrop" sizes="(max-width: 1024px) 100vw, 960px" unoptimized={!isOptimizableImage(image.src)} />
          <div className={`gallery-kenburns ${i % 2 ? 'kb-right' : 'kb-left'}`}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={i === 0}
              className="gallery-photo"
              style={image.focus ? { objectPosition: image.focus } : undefined}
              sizes="(max-width: 1024px) 100vw, 960px"
              unoptimized={!isOptimizableImage(image.src)}
            />
          </div>
        </div>
      ))}

      <div className="gallery-vignette" aria-hidden />

      <button
        type="button"
        onClick={() => setLightboxIndex(active)}
        className="absolute inset-0 z-[1] cursor-zoom-in focus:outline-none"
        aria-label={`Phóng to ảnh ${active + 1}`}
      />

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[2] flex gap-2">
        {playButton}
        {zoomButton}
      </div>

      {navButtons(true)}

      <div className="absolute inset-x-0 bottom-0 z-[2] px-5 sm:px-8 pb-5 sm:pb-7 pointer-events-none text-white">
        <div className="flex items-end justify-between gap-4">
          <div key={active} className="gallery-caption min-w-0">
            <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.3em] text-white/75 mb-1 whitespace-nowrap">
              {brand.groom} &amp; {brand.bride}
              <span className="hidden sm:inline"> · {brand.date}</span>
            </p>
            <p
              className={`font-serif leading-tight drop-shadow-lg line-clamp-2 ${
                portraitAlbum ? 'text-xl sm:text-3xl' : 'text-[1.65rem] sm:text-5xl'
              }`}
            >
              {current.caption ?? 'Khoảnh khắc yêu thương'}
            </p>
          </div>
          <p className="shrink-0 tabular-nums tracking-[0.2em] text-sm sm:text-base" aria-live="polite">
            <span className="text-lg sm:text-2xl font-semibold">{pad(active + 1)}</span>
            <span className="text-white/60"> / {pad(total)}</span>
          </p>
        </div>
        {progressBars && <div className="mt-4">{progressBars}</div>}
      </div>
    </div>
  )

  const frame = (image: GalleryImage, i: number, className: string) => (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      className={className}
      style={image.focus ? { objectPosition: image.focus } : undefined}
      sizes="(max-width: 768px) 50vw, 360px"
      unoptimized={!isOptimizableImage(image.src)}
    />
  )

  const gridStage = (
    <div className="grid grid-cols-2 gap-3">
      {images.map((image, i) => (
        <button
          key={image.src + i}
          type="button"
          onClick={() => setLightboxIndex(i)}
          className={`relative overflow-hidden rounded-2xl bg-w-qr focus:outline-none focus-visible:ring-2 focus-visible:ring-w-gold ${
            i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/5]'
          }`}
          aria-label={`Phóng to ảnh ${i + 1}: ${image.caption ?? image.alt}`}
        >
          {frame(image, i, 'object-cover')}
          {image.caption && (
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 text-left font-serif text-lg text-white">
              {image.caption}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  const stackStage = (
    <div className="mx-auto max-w-sm">
      <div className="relative mx-auto h-[26rem] w-[78%]">
        {images.map((image, i) => {
          const depth = mod(i - active, total)
          if (depth > 2) return null
          return (
            <button
              key={image.src + i}
              type="button"
              onClick={() => (depth === 0 ? setLightboxIndex(i) : goTo(i))}
              className="absolute inset-0 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-w-gold"
              style={{
                transform: `translate(${depth * 14}px, ${depth * 12}px) rotate(${depth * 2.5}deg)`,
                zIndex: 10 - depth,
              }}
              aria-label={depth === 0 ? `Phóng to ảnh ${i + 1}` : `Đưa ảnh ${i + 1} lên trên`}
            >
              {frame(image, i, 'object-cover')}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        {playButton}
        <div key={active} className="min-w-0 flex-1 text-center">
          <p className="font-serif text-2xl text-w-strong line-clamp-1">{current.caption ?? 'Khoảnh khắc yêu thương'}</p>
          <p className="text-xs tracking-[0.18em] text-w-muted">{pad(active + 1)} / {pad(total)}</p>
        </div>
        <button type="button" onClick={goNext} className="gallery-icon-btn" aria-label="Ảnh sau">
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
      {progressBars && <div className="mt-3">{progressBars}</div>}
    </div>
  )

  const filmStage = (
    <div>
      <div ref={stripRef} className="flex gap-3 overflow-x-auto py-3" role="list">
        {images.map((image, i) => (
          <button
            key={image.src + i}
            type="button"
            data-index={i}
            role="listitem"
            onClick={() => (i === active ? setLightboxIndex(i) : goTo(i))}
            className={`relative h-52 w-36 shrink-0 overflow-hidden rounded-md bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-w-gold ${
              i === active ? 'ring-2 ring-w-gold scale-105' : 'opacity-75'
            }`}
            aria-label={i === active ? `Phóng to ảnh ${i + 1}` : `Xem ảnh ${i + 1}`}
            aria-current={i === active}
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-3 bg-[radial-gradient(circle,transparent_35%,#1c1917_36%)] bg-[length:12px_12px]" aria-hidden />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-3 bg-[radial-gradient(circle,transparent_35%,#1c1917_36%)] bg-[length:12px_12px]" aria-hidden />
            {frame(image, i, 'object-cover')}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {playButton}
        <div key={active} className="min-w-0 flex-1 text-center">
          <p className="font-serif text-2xl text-w-strong line-clamp-1">{current.caption ?? 'Khoảnh khắc yêu thương'}</p>
        </div>
        {zoomButton}
      </div>
      {progressBars && <div className="mt-3">{progressBars}</div>}
    </div>
  )

  const stage = mosaic ? gridStage : stack ? stackStage : film ? filmStage : ring ? ringStage : slideStage

  return (
    <>
      <section id="khoanh-khac" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="section-frame">
            <SectionHeading
              icon={<Images className="w-7 h-7" aria-hidden />}
              description={
                mosaic
                  ? 'Bấm một tấm ảnh để xem lớn.'
                  : stack
                    ? 'Ảnh in xếp chồng. Bấm tấm bên dưới để lật lên.'
                    : film
                      ? 'Kéo dải phim, bấm khung đang sáng để xem lớn.'
                      : ring
                        ? 'Xoay vòng ảnh, bấm tấm đang ở giữa để xem lớn.'
                        : 'Những khoảnh khắc đẹp nhất trên hành trình của chúng mình'
              }
            >
              Album ảnh cưới
            </SectionHeading>

            <Reveal variant={ring ? 'zoom' : 'mask'}>{stage}</Reveal>

            {total > 1 && !mosaic && !stack && !film && (
              <Reveal delay={150}>
                <div
                  ref={stripRef}
                  data-album={portraitAlbum ? 'portrait' : 'landscape'}
                  className="gallery-strip relative mt-4 flex gap-2 sm:gap-3 overflow-x-auto py-1 px-1"
                >
                  {images.map((image, i) => (
                    <button
                      key={image.src + i}
                      type="button"
                      data-index={i}
                      onClick={() => goTo(i)}
                      className={`gallery-thumb ${i === active ? 'is-active' : ''}`}
                      aria-label={`Xem ảnh ${i + 1}`}
                      aria-current={i === active}
                    >
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        className="object-cover"
                        style={image.focus ? { objectPosition: image.focus } : undefined}
                        sizes="112px"
                        unoptimized={!isOptimizableImage(image.src)}
                      />
                    </button>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <GalleryLightbox
        images={images}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  )
}
