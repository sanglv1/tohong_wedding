'use client'

import { useState } from 'react'
import { Music, Palette } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBackgroundMusic } from '@/hooks/use-background-music'
import { useWeddingTheme } from '@/hooks/use-wedding-theme'
import { BACKGROUND_MUSIC } from '@/lib/music'

const btnClass =
  'theme-floating-btn w-11 h-11 rounded-full shadow-lg border flex items-center justify-center active:scale-95 transition-all touch-manipulation focus:outline-none'

export function FloatingActions({
  music = BACKGROUND_MUSIC,
  allowThemeCycle = true,
}: {
  music?: { playlist: string[]; volume: number }
  allowThemeCycle?: boolean
}) {
  const { isPlaying, toggle } = useBackgroundMusic(music)
  const { themeName, cycleTheme } = useWeddingTheme()
  const [toastKey, setToastKey] = useState(0)
  const canPlay = music.playlist.length > 0
  if (!allowThemeCycle && !canPlay) return null

  return (
    <div className="fixed z-40 right-4 sm:right-6 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:bottom-6 flex flex-col gap-2">
      {toastKey > 0 && (
        <span key={toastKey} className="theme-toast" role="status">
          {themeName}
        </span>
      )}
      {allowThemeCycle && (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              cycleTheme(e)
              setToastKey((k) => k + 1)
            }}
            className={btnClass}
            aria-label={`Đổi màu nền (hiện: ${themeName})`}
          >
            <Palette className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8} className="font-medium">
          Đổi màu nền (hiện: {themeName})
        </TooltipContent>
      </Tooltip>
      )}

      {canPlay && (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            className={btnClass}
            aria-label={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <span className="music-bars" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            ) : (
              <Music className="w-5 h-5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8} className="font-medium">
          {isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
        </TooltipContent>
      </Tooltip>
      )}
    </div>
  )
}
