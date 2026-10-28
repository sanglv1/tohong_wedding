/* Ảnh khách tải lên đi qua /api/media, không cố định một domain để next/image tối ưu */
/* eslint-disable @next/next/no-img-element */
import Image from 'next/image'
import { HERO_IMAGE, WEDDING } from '@/lib/constants'
import { getPublicImageSize } from '@/lib/image-size'
import { isOptimizableImage } from '@/lib/media-src'

/** Ảnh ngang hơn tỉ lệ này thì hiện trọn ảnh thay vì cắt cho đầy khung */
const LANDSCAPE_RATIO = 1.15
const SIZES = '(min-width: 896px) 380px, (min-width: 768px) 45vw, 92vw'

export function HeroPhoto({
  className = '',
  hero = HERO_IMAGE,
  groomShort = WEDDING.groomShort,
  brideShort = WEDDING.brideShort,
  fit = 'auto',
  sizes = SIZES,
  framed = true,
  position,
}: {
  className?: string
  hero?: { src: string; focus: string }
  groomShort?: string
  brideShort?: string
  /** auto: ảnh ngang hiện trọn. cover: ảnh luôn đầy khung, neo theo focus. */
  fit?: 'auto' | 'cover'
  sizes?: string
  /** false khi ảnh là nền của tên, không cần khung vàng bên trong. */
  framed?: boolean
  /** Ghi đè điểm neo khi chữ cần nhiều khoảng trống phía trên mặt. */
  position?: string
}) {
  const alt = `Ảnh cưới ${groomShort} và ${brideShort}`
  const frame = framed ? '' : 'hero-photo-plain'
  const objectPosition = position ?? hero.focus
  if (!hero.src) return <div className={`invite-photo-window bg-w-tint ${frame} ${className}`} aria-hidden />

  if (!isOptimizableImage(hero.src)) {
    return (
      <div className={`invite-photo-window ${frame} ${className}`}>
        <img src={hero.src} alt={alt} className="h-full w-full object-cover" style={{ objectPosition }} />
      </div>
    )
  }

  const size = getPublicImageSize(hero.src)
  const isLandscape = fit === 'auto' && size ? size.width / size.height > LANDSCAPE_RATIO : false

  return (
    <div className={`invite-photo-window ${frame} ${className}`}>
      {isLandscape ? (
        <>
          <Image src={hero.src} alt="" aria-hidden fill priority sizes={sizes} className="invite-photo-backdrop" />
          <Image src={hero.src} alt={alt} fill priority sizes={sizes} className="object-contain" />
        </>
      ) : (
        <Image
          src={hero.src}
          alt={alt}
          fill
          priority
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition }}
        />
      )}
    </div>
  )
}
