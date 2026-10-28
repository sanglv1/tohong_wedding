/** Hai nhẫn, nét rượu, dùng cạnh chữ Tơ Hồng trên nền kem. */
export function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="12.15" cy="16" r="5.15" fill="none" stroke="#4a1520" strokeWidth="2.1" />
      <circle cx="19.85" cy="16" r="5.15" fill="none" stroke="#4a1520" strokeWidth="2.1" />
    </svg>
  )
}
