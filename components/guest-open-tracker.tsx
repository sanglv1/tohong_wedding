'use client'

import { useEffect } from 'react'
import { guestKey, PREVIEW_PARAM, readGuestName } from '@/lib/guest'
import { recordGuestOpen } from '@/lib/guests'

/** Báo cho trang quản lý biết khách đã mở link mời (mỗi phiên trình duyệt tính một lần) */
export function GuestOpenTracker({ endpoint = '/api/guest-open' }: { endpoint?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const name = readGuestName(window.location.search)
    if (!name || params.has(PREVIEW_PARAM)) return
    const flag = `guest-opened:${endpoint}:${guestKey(name)}`
    try {
      if (sessionStorage.getItem(flag)) return
      sessionStorage.setItem(flag, '1')
    } catch {}
    recordGuestOpen(name, endpoint).catch(() => {})
  }, [endpoint])
  return null
}
