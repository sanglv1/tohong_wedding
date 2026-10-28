'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play, X, ZoomIn, ZoomOut } from 'lucide-react'
import type { GalleryImage } from '@/lib/gallery'
import { isOptimizableImage } from '@/lib/media-src'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { SlideProgress } from './gallery-progress'

const LIGHTBOX_INTERVAL = 4000
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5
const DOUBLE_TAP_MS = 300
const SWIPE_PX = 50
const CLOSE_DRAG_PX = 110

interface GalleryLightboxProps {
  images: GalleryImage[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function GalleryLightbox({ images, index, onIndexChange, onClose }: GalleryLightboxProps) {
  const total = images.length
  const [playing, setPlaying] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const open = index !== null
  const current = index === null ? null : images[index]

  const changeIndex = (i: number) => {
    setZoomed(false)
    onIndexChange(i)
  }
  const goPrev = () => index !== null && changeIndex((index - 1 + total) % total)
  const goNext = () => index !== null && changeIndex((index + 1) % total)

  useEffect(() => {
    if (index === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      setZoomed(false)
      onIndexChange(e.key === 'ArrowLeft' ? (index - 1 + total) % total : (index + 1) % total)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, total, onIndexChange])

  useEffect(() => {
    const strip = thumbsRef.current
    const thumb = strip?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (!strip || !thumb) return
    strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: 'smooth' })
  }, [index])

  const close = () => {
    setPlaying(false)
    setZoomed(false)
    onClose()
  }

  const neighbours = index === null || total < 2 ? [] : [images[(index + 1) % total], images[(index - 1 + total) % total]]

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        className="z-[130] top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none sm:max-w-none h-[100svh] rounded-none border-0 bg-black p-0 gap-0 flex flex-col text-white overflow-hidden"
      >
        <DialogTitle className="sr-only">{current?.alt ?? 'Xem ảnh'}</DialogTitle>

        {current && (
          <div key={current.src} className="gallery-lightbox-ambient" aria-hidden>
            <Image src={current.src} alt="" fill sizes="10vw" className="object-cover" unoptimized={!isOptimizableImage(current.src)} />
          </div>
        )}

        {total > 1 && index !== null && (
          <div className="absolute top-0 inset-x-0 h-0.5 bg-white/10 z-10" aria-hidden>
            {playing && (
              <SlideProgress
                slideKey={index}
                duration={LIGHTBOX_INTERVAL}
                running
                onDone={goNext}
                className="bg-w-gold"
              />
            )}
          </div>
        )}

        <div className="relative z-[3] flex items-center justify-between px-4 sm:px-6 h-14 shrink-0">
          <span className="text-sm font-medium tracking-[0.2em] tabular-nums text-white/90 [text-shadow:0_1px_4px_rgb(0_0_0/0.7)]" aria-live="polite">
            {index !== null && `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className="gallery-icon-btn"
              aria-label={zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh'}
              aria-pressed={zoomed}
            >
              {zoomed ? <ZoomOut className="w-4 h-4" aria-hidden /> : <ZoomIn className="w-4 h-4" aria-hidden />}
            </button>
            {total > 1 && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="gallery-icon-btn"
                aria-label={playing ? 'Dừng trình chiếu' : 'Trình chiếu tự động'}
                aria-pressed={playing}
              >
                {playing ? <Pause className="w-4 h-4" aria-hidden /> : <Play className="w-4 h-4" aria-hidden />}
              </button>
            )}
            <DialogClose className="gallery-icon-btn" aria-label="Đóng">
              <X className="w-5 h-5" aria-hidden />
            </DialogClose>
          </div>
        </div>

        {current && index !== null && (
          <div className="relative z-[1] flex-1 min-h-0">
            <ZoomableSlide
              key={index}
              image={current}
              zoomed={zoomed}
              onZoomedChange={(z) => {
                setZoomed(z)
                if (z) setPlaying(false)
              }}
              onSwipe={(dir) => (dir === 'next' ? goNext() : goPrev())}
              onClose={close}
            />
            {current.caption && !zoomed && (
              <p className="pointer-events-none absolute bottom-3 inset-x-0 text-center font-serif text-2xl sm:text-3xl text-white drop-shadow-lg px-6">
                {current.caption}
              </p>
            )}

            {total > 1 && !zoomed && (
              <>
                <button type="button" onClick={goPrev} className="gallery-nav left-2 sm:left-5" aria-label="Ảnh trước">
                  <ChevronLeft className="w-6 h-6" aria-hidden />
                </button>
                <button type="button" onClick={goNext} className="gallery-nav right-2 sm:right-5" aria-label="Ảnh sau">
                  <ChevronRight className="w-6 h-6" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}

        {neighbours.map((image) => (
          <Image key={image.src} src={image.src} alt="" width={8} height={8} sizes="100vw" loading="eager" className="hidden" unoptimized={!isOptimizableImage(image.src)} />
        ))}

        {total > 1 && (
          <div
            ref={thumbsRef}
            className={`gallery-strip relative z-[1] shrink-0 flex gap-2 overflow-x-auto px-4 py-3 sm:py-4 transition-opacity ${
              zoomed ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            {images.map((image, i) => (
              <button
                key={image.src + i}
                type="button"
                data-index={i}
                onClick={() => changeIndex(i)}
                className={`relative shrink-0 w-12 h-16 sm:w-14 sm:h-[4.75rem] rounded-lg overflow-hidden transition-all first:ml-auto last:mr-auto ${
                  i === index ? 'ring-2 ring-w-gold opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
                aria-label={`Ảnh ${i + 1}`}
                aria-current={i === index}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  className="object-cover"
                  style={image.focus ? { objectPosition: image.focus } : undefined}
                  sizes="64px"
                  unoptimized={!isOptimizableImage(image.src)}
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ZoomableSlideProps {
  image: GalleryImage
  zoomed: boolean
  onZoomedChange: (zoomed: boolean) => void
  onSwipe: (dir: 'next' | 'prev') => void
  onClose: () => void
}

type Point = { x: number; y: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Ảnh trong lightbox: chạm 2 lần / nháy đúp để phóng to đúng chỗ, chụm 2 ngón để zoom, kéo để di chuyển khi đang phóng to.
 * Khi chưa phóng to: vuốt ngang để chuyển ảnh, kéo xuống để đóng.
 */
function ZoomableSlide({ image, zoomed, onZoomedChange, onSwipe, onClose }: ZoomableSlideProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [dragY, setDragY] = useState(0)
  const [gesturing, setGesturing] = useState(false)
  const pointers = useRef(new Map<number, Point>())
  const start = useRef<{ point: Point; view: typeof view; time: number } | null>(null)
  const pinch = useRef<{ dist: number; scale: number } | null>(null)
  const lastTap = useRef<{ time: number; point: Point } | null>(null)
  const lastPointerType = useRef('mouse')

  // Nút kính lúp ở thanh trên: đổi trạng thái từ bên ngoài
  const [syncedZoom, setSyncedZoom] = useState(zoomed)
  if (zoomed !== syncedZoom) {
    setSyncedZoom(zoomed)
    setView(zoomed ? { scale: DOUBLE_TAP_SCALE, x: 0, y: 0 } : { scale: 1, x: 0, y: 0 })
  }

  const bounded = (scale: number, x: number, y: number) => {
    const el = ref.current
    if (!el) return { scale, x, y }
    const maxX = ((scale - 1) * el.clientWidth) / 2
    const maxY = ((scale - 1) * el.clientHeight) / 2
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
  }

  const apply = (next: typeof view) => {
    const v = next.scale <= 1.02 ? { scale: 1, x: 0, y: 0 } : bounded(next.scale, next.x, next.y)
    setView(v)
    const isZoomed = v.scale > 1
    if (isZoomed !== syncedZoom) {
      setSyncedZoom(isZoomed)
      onZoomedChange(isZoomed)
    }
  }

  const toggleAt = (point: Point) => {
    if (view.scale > 1) return apply({ scale: 1, x: 0, y: 0 })
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const cx = point.x - rect.left - rect.width / 2
    const cy = point.y - rect.top - rect.height / 2
    apply({ scale: DOUBLE_TAP_SCALE, x: -cx * (DOUBLE_TAP_SCALE - 1), y: -cy * (DOUBLE_TAP_SCALE - 1) })
  }

  const distance = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    lastPointerType.current = e.pointerType
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setGesturing(true)
    if (pointers.current.size === 1) {
      start.current = { point: { x: e.clientX, y: e.clientY }, view, time: Date.now() }
    } else if (pointers.current.size === 2) {
      pinch.current = { dist: distance(), scale: view.scale }
      start.current = null
      setDragY(0)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const scale = clamp((pinch.current.scale * distance()) / pinch.current.dist, 1, MAX_SCALE)
      apply({ scale, x: view.x * (scale / view.scale), y: view.y * (scale / view.scale) })
      return
    }
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.point.x
    const dy = e.clientY - s.point.y
    if (s.view.scale > 1) apply({ scale: s.view.scale, x: s.view.x + dx, y: s.view.y + dy })
    else if (e.pointerType !== 'mouse' && dy > 0 && Math.abs(dy) > Math.abs(dx)) setDragY(dy)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size > 0) return
    setGesturing(false)
    setDragY(0)
    start.current = null
    if (!s || e.type === 'pointercancel') return

    const dx = e.clientX - s.point.x
    const dy = e.clientY - s.point.y
    if (s.view.scale === 1) {
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) return onSwipe(dx < 0 ? 'next' : 'prev')
      if (e.pointerType !== 'mouse' && dy > CLOSE_DRAG_PX && dy > Math.abs(dx)) return onClose()
    }

    // Chạm 2 lần trên màn hình cảm ứng; chuột dùng onDoubleClick
    const isTap = Math.hypot(dx, dy) < 10 && Date.now() - s.time < 250
    if (!isTap || e.pointerType === 'mouse') return
    const prev = lastTap.current
    const point = { x: e.clientX, y: e.clientY }
    if (prev && Date.now() - prev.time < DOUBLE_TAP_MS && Math.hypot(prev.point.x - point.x, prev.point.y - point.y) < 30) {
      lastTap.current = null
      toggleAt(point)
    } else {
      lastTap.current = { time: Date.now(), point }
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    const scale = clamp(view.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, MAX_SCALE)
    apply({ scale, x: view.x * (scale / view.scale), y: view.y * (scale / view.scale) })
  }

  const closeProgress = Math.min(dragY / (CLOSE_DRAG_PX * 2.5), 0.6)

  return (
    <div
      ref={ref}
      className={`gallery-lightbox-slide absolute inset-0 sm:inset-x-20 touch-none select-none ${
        view.scale > 1 ? (gesturing ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => lastPointerType.current === 'mouse' && toggleAt({ x: e.clientX, y: e.clientY })}
      onWheel={onWheel}
      style={{ opacity: 1 - closeProgress }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${view.x}px, ${view.y + dragY}px, 0) scale(${view.scale * (1 - closeProgress / 3)})`,
          transition: gesturing ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1)',
        }}
      >
        <Image src={image.src} alt={image.alt} fill draggable={false} className="object-contain" sizes="100vw" unoptimized={!isOptimizableImage(image.src)} />
      </div>
    </div>
  )
}
