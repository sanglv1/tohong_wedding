'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BACKGROUND_MUSIC } from '@/lib/music'

export const WEDDING_OPEN_EVENT = 'wedding-open'

type Music = { playlist: string[]; volume: number }

/**
 * Chỉ tạo và tải file nhạc khi khách mở thiệp hoặc bấm nút nhạc,
 * để lần tải trang đầu tiên không phải tải vài MB âm thanh.
 */
export function useBackgroundMusic(music: Music = BACKGROUND_MUSIC) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef(0)
  const failedRef = useRef(new Set<number>())
  const pausedByVisibilityRef = useRef(false)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const musicRef = useRef(music)
  musicRef.current = music

  const getAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    const { playlist, volume } = musicRef.current
    if (playlist.length === 0) return null

    const audio = new Audio(playlist[0])
    audio.volume = volume
    audio.loop = playlist.length === 1
    audio.preload = 'auto'

    const playTrack = (index: number) => {
      trackRef.current = index
      audio.src = playlist[index]
      audio.play().catch(() => {})
    }
    const nextPlayable = () => {
      for (let step = 1; step <= playlist.length; step++) {
        const index = (trackRef.current + step) % playlist.length
        if (!failedRef.current.has(index)) return index
      }
      return null
    }

    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => {
      const next = nextPlayable()
      if (next !== null) playTrack(next)
    })
    audio.addEventListener('error', () => {
      failedRef.current.add(trackRef.current)
      setIsPlaying(false)
      const next = nextPlayable()
      if (next !== null) playTrack(next)
    })

    audioRef.current = audio
    return audio
  }, [])

  const play = useCallback(() => {
    getAudio()?.play().catch(() => {})
  }, [getAudio])

  /**
   * Bắt đầu phát (tắt tiếng) ngay trong thao tác bấm để trình duyệt cho phép,
   * rồi sau delayMs mới bật tiếng và tăng dần âm lượng
   */
  const playAfter = useCallback(
    (delayMs: number) => {
      const audio = getAudio()
      if (!audio) return
      const target = musicRef.current.volume
      audio.muted = true
      audio.play().catch(() => {})
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = setTimeout(() => {
        fadeTimerRef.current = undefined
        audio.volume = 0
        audio.muted = false
        const start = performance.now()
        const FADE_MS = 3000
        const step = (now: number) => {
          const t = Math.min((now - start) / FADE_MS, 1)
          audio.volume = target * t
          if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, delayMs)
    },
    [getAudio],
  )

  const toggle = useCallback(() => {
    const audio = getAudio()
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [getAudio])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const delayMs = (e as CustomEvent<{ delayMs?: number }>).detail?.delayMs
      if (delayMs) playAfter(delayMs)
      else play()
    }
    window.addEventListener(WEDDING_OPEN_EVENT, onOpen)

    const onVisibilityChange = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden && !audio.paused) {
        pausedByVisibilityRef.current = true
        audio.pause()
      } else if (!document.hidden && pausedByVisibilityRef.current) {
        pausedByVisibilityRef.current = false
        audio.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener(WEDDING_OPEN_EVENT, onOpen)
      clearTimeout(fadeTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [play, playAfter])

  return { isPlaying, toggle }
}
