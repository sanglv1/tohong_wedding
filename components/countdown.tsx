'use client'

import { useEffect, useState } from 'react'
import { WEDDING } from '@/lib/constants'

type CountdownState =
  | { status: 'loading' }
  | { status: 'counting'; days: number; hours: number; minutes: number; seconds: number }
  | { status: 'today' }
  | { status: 'past' }

function calculate(now: number, start: number, end: number): CountdownState {
  if (!start || !end) return { status: 'loading' }
  if (now >= end) return { status: 'past' }
  if (now >= start) return { status: 'today' }
  const diff = start - now
  return {
    status: 'counting',
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function CountdownItem({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="invite-count-box w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden text-xl sm:text-2xl font-semibold tabular-nums mb-1.5">
        <span key={value ?? 'empty'} className={value === null ? undefined : 'count-tick'}>
          {value === null ? '--' : String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[0.65rem] uppercase tracking-[0.2em] invite-muted">{label}</span>
    </div>
  )
}

export function Countdown({ startISO = WEDDING.startISO, endISO = WEDDING.endISO }: { startISO?: string; endISO?: string }) {
  const [state, setState] = useState<CountdownState>({ status: 'loading' })

  useEffect(() => {
    const start = new Date(startISO).getTime()
    const end = new Date(endISO).getTime()
    const tick = () => setState(calculate(Date.now(), start, end))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [startISO, endISO])

  if (state.status === 'past') {
    return (
      <p className="text-base sm:text-lg font-medium italic invite-names">
        Cảm ơn quý khách đã đến dự ngày trọng đại của chúng tôi!
      </p>
    )
  }

  if (state.status === 'today') {
    return (
      <p className="text-base sm:text-lg font-medium italic invite-names">
        Hôm nay là ngày vui của chúng tôi. Hẹn gặp quý khách!
      </p>
    )
  }

  const counting = state.status === 'counting' ? state : null

  return (
    <div className="flex justify-center gap-2.5 sm:gap-4" role="timer" aria-label="Đếm ngược đến lễ thành hôn">
      <CountdownItem value={counting?.days ?? null} label="Ngày" />
      <CountdownItem value={counting?.hours ?? null} label="Giờ" />
      <CountdownItem value={counting?.minutes ?? null} label="Phút" />
      <CountdownItem value={counting?.seconds ?? null} label="Giây" />
    </div>
  )
}
