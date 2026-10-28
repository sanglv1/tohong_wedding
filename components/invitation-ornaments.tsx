/** Hoạ tiết viền vàng cho khung thiệp: góc hoa văn và đường phân cách */

const CORNER_ROTATION = {
  'top-left': 'rotate-0',
  'top-right': 'rotate-90',
  'bottom-right': 'rotate-180',
  'bottom-left': '-rotate-90',
} as const

const CORNER_POSITION = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-right': 'bottom-2 right-2',
  'bottom-left': 'bottom-2 left-2',
} as const

export function CornerOrnament({ position }: { position: keyof typeof CORNER_ROTATION }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      className={`invite-corner absolute ${CORNER_POSITION[position]} ${CORNER_ROTATION[position]}`}
      aria-hidden
    >
      <path d="M4 44V12a8 8 0 0 1 8-8h32" />
      <path d="M11 54V19a8 8 0 0 1 8-8h35" opacity="0.55" />
      <path d="M19 19c10 0 16 6 16 16-10 0-16-6-16-16Z" fill="currentColor" fillOpacity="0.18" />
      <path d="M19 19c6 2 10 6 12 12" opacity="0.7" />
      <path d="M26 12c4-4 10-5 14-2-4 4-10 5-14 2Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M12 26c-4 4-5 10-2 14 4-4 5-10 2-14Z" fill="currentColor" fillOpacity="0.25" />
      <circle cx="4" cy="50" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="50" cy="4" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="19" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Một bông năm cánh giữa hai nét chỉ, trên lá thư lụa */
export function SilkBloom() {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg className="veil-thread mt-4 h-14 w-44" viewBox="0 0 180 56" fill="none" aria-hidden>
      <path className="veil-thread-line" pathLength="100" d="M8 36C28 16 52 14 74 26" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path
        className="veil-thread-line veil-thread-line-late"
        pathLength="100"
        d="M106 26C128 14 152 16 172 36"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <g transform="translate(90 28)">
        <g className="veil-bloom">
          <g fill="#f4d5cc" stroke="currentColor" strokeWidth="0.9">
            {petals.map((turn) => (
              <ellipse key={turn} cx="0" cy="-7.2" rx="2.2" ry="5" transform={`rotate(${turn})`} />
            ))}
          </g>
          <circle r="2" fill="#c9a27a" />
          <circle r="0.75" fill="#fffaf7" />
        </g>
      </g>
    </svg>
  )
}

/** Cành nhỏ góc khung câu chuyện: một bông, hai lá, thân đi dọc mép */
export function SilkSprig() {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg className="veil-sprig" viewBox="0 0 64 100" fill="none" aria-hidden>
      <path className="veil-sprig-stem" pathLength="100" d="M42 26C46 42 44 60 34 86" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path className="veil-sprig-leaf" d="M44 42c7-1 12 5 8 11-6-2-10-6-8-11Z" fill="#f4d5cc" stroke="currentColor" strokeWidth="0.8" />
      <path
        className="veil-sprig-leaf veil-sprig-leaf-late"
        d="M40 60c-9 1-13 8-8 13 5-4 9-8 8-13Z"
        fill="#f4d5cc"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <g transform="translate(40 16)">
        <g className="veil-sprig-bloom">
          <g fill="#f4d5cc" stroke="currentColor" strokeWidth="0.75">
            {petals.map((turn) => (
              <ellipse key={turn} cx="0" cy="-5.2" rx="1.7" ry="3.6" transform={`rotate(${turn})`} />
            ))}
          </g>
          <circle r="1.45" fill="#c9a27a" />
        </g>
      </g>
    </svg>
  )
}

export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden>
      <span className="invite-rule w-12 sm:w-16" />
      <svg viewBox="0 0 24 12" className="w-7 h-3.5 text-[#b08440]" fill="currentColor">
        <path d="M1 6l3-3 3 3-3 3z" />
        <path d="M17 6l3-3 3 3-3 3z" />
        <circle cx="12" cy="6" r="1.8" />
      </svg>
      <span className="invite-rule w-12 sm:w-16" />
    </div>
  )
}
