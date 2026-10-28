'use client'

/* Ảnh do từng người dán link bên ngoài, không cố định một domain để next/image tối ưu */
/* eslint-disable @next/next/no-img-element */
import { useState, type ReactNode } from 'react'

export function Lunar({ text, className }: { text: string; className?: string }) {
  if (!text) return null
  return <p className={className ?? 'text-sm italic opacity-80'}>{text}</p>
}

export function HeroPhoto({
  src,
  alt,
  className,
  focus,
  fallback = null,
}: {
  src?: string
  alt: string
  className: string
  focus?: string
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <>{fallback}</>
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={focus ? { objectPosition: focus } : undefined}
      onError={() => setFailed(true)}
    />
  )
}

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 58C32 40 40 30 56 26c-10 2-18-2-24-12-6 10-14 14-24 12 16 4 24 14 24 32z" fill="currentColor" />
    </svg>
  )
}
