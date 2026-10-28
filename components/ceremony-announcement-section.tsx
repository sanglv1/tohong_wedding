import { MapPin, CalendarPlus } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { Reveal } from './reveal'

export function CeremonyAnnouncementSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const WEDDING = model.wedding
  const ANNOUNCEMENT = model.announcement
  const FAMILY_ADDRESSES = model.familyAddresses
  const mapEmbed = model.mapEmbed
  return (
    <section id="thong-bao-le" className="py-16 sm:py-20 md:py-28 overflow-x-hidden scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal className="section-frame ceremony-card text-center overflow-hidden">
          <p className="ceremony-sub text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.28em] font-light mb-4">
            {ANNOUNCEMENT}
          </p>

          <h2 className="ceremony-names font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3">
            <span>{WEDDING.groomShort}</span>
            <span className="ceremony-accent">&</span>
            <span>{WEDDING.brideShort}</span>
          </h2>

          <p className="ceremony-sub text-sm sm:text-base italic mb-6 opacity-95">
            {WEDDING.ceremony.venue
              ? `${WEDDING.ceremony.name} · ${WEDDING.ceremony.venue}`
              : WEDDING.ceremony.name}
          </p>

          <div className="ceremony-line flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 py-4 sm:py-5 mb-2 border-y">
            <div className="ceremony-sub text-xs sm:text-base font-medium">{WEDDING.ceremony.timeDisplay}</div>
            <div className="ceremony-divider hidden sm:block w-px self-stretch min-h-[2.5rem] shrink-0" aria-hidden />
            <div className="ceremony-divider sm:hidden w-full max-w-[4rem] h-px" aria-hidden />
            <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0 flex-wrap">
              <span className="ceremony-sub text-[10px] sm:text-sm uppercase tracking-wider leading-tight">
                {WEDDING.ceremony.dayOfWeek}
              </span>
              <span className="ceremony-names text-lg sm:text-2xl font-bold" aria-hidden>/</span>
              <span className="ceremony-names text-2xl sm:text-4xl font-bold tabular-nums">{WEDDING.ceremony.day}</span>
              <span className="ceremony-names text-lg sm:text-2xl font-bold" aria-hidden>/</span>
              <span className="ceremony-sub text-[10px] sm:text-sm uppercase tracking-wider leading-tight">
                {WEDDING.ceremony.month}
              </span>
            </div>
            <div className="ceremony-divider hidden sm:block w-px self-stretch min-h-[2.5rem] shrink-0" aria-hidden />
            <div className="ceremony-divider sm:hidden w-full max-w-[4rem] h-px" aria-hidden />
            <div className="ceremony-sub text-xs sm:text-base">
              {WEDDING.ceremony.year}
              {WEDDING.ceremony.lunarYear && <span className="ceremony-accent"> / ({WEDDING.ceremony.lunarYear})</span>}
            </div>
          </div>

          {WEDDING.ceremony.lunarDate && <p className="ceremony-lunar text-sm italic mb-6">({WEDDING.ceremony.lunarDate})</p>}

          {WEDDING.ceremony.location && (
            <p className="ceremony-names text-sm sm:text-base font-semibold mb-6 leading-relaxed px-1 break-words">
              Tại: {WEDDING.ceremony.location}
            </p>
          )}

          {mapEmbed && (
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-xl overflow-hidden border border-w-gold/50 mb-6 bg-black/10">
              <iframe
                src={mapEmbed}
                title={`Bản đồ đường đến ${WEDDING.ceremony.location}`}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {FAMILY_ADDRESSES.groomFamily.mapsUrl && (
              <a
                href={FAMILY_ADDRESSES.groomFamily.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ceremony-btn inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition"
              >
                <MapPin className="w-4 h-4" aria-hidden />
                Chỉ đường
              </a>
            )}
            {WEDDING.addToCalendarUrl && (
              <a
                href={WEDDING.addToCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ceremony-btn inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition"
              >
                <CalendarPlus className="w-4 h-4" aria-hidden />
                Thêm lịch
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
