import { MapPin, Clock, CalendarPlus } from 'lucide-react'
import { CLASSIC_MODEL } from '@/lib/constants'
import type { WeddingModel } from '@/lib/wedding-model'
import { Reveal, type RevealVariant } from './reveal'
import { SectionHeading } from './section-heading'

function AddressLink({ label, address, mapsUrl }: { label: string; address: string; mapsUrl: string }) {
  if (!address && !mapsUrl) return null
  return (
    <div>
      <p className="text-xs font-medium text-w-muted">{label}</p>
      {address && <p className="text-sm text-w-soft">{address}</p>}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-w-muted hover:text-w-strong font-medium text-xs mt-1 underline-offset-2 hover:underline"
        >
          <MapPin className="w-3 h-3" aria-hidden />
          Xem bản đồ {label.toLowerCase()}
        </a>
      )}
    </div>
  )
}

function EventCard({
  title,
  time,
  venue,
  date,
  delay,
  variant,
}: {
  title: string
  time: string
  venue: string
  date: string
  delay: number
  variant: RevealVariant
}) {
  return (
    <Reveal delay={delay} variant={variant} className="card-wedding rounded-2xl p-6 sm:p-8">
      <h3 className="text-3xl font-serif text-w-strong mb-6">{title}</h3>
      <div className="space-y-5">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-w-tint flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-w-soft" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-w-label uppercase tracking-wider">Thời gian</p>
            <p className="font-medium text-w-text">{time}</p>
            {date && <p className="text-sm text-w-muted">{date}</p>}
          </div>
        </div>
        {venue && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-w-tint flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-w-soft" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-w-label uppercase tracking-wider mb-2">Địa điểm</p>
              <p className="font-medium text-w-text">{venue}</p>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}

export function ScheduleSection({ model = CLASSIC_MODEL }: { model?: WeddingModel }) {
  const WEDDING = model.wedding
  return (
    <section id="lich-trinh" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="section-frame">
          <SectionHeading>Lịch trình</SectionHeading>

          {WEDDING.addToCalendarUrl && (
            <Reveal delay={50} className="flex justify-center mb-6 sm:mb-8">
              <a
                href={WEDDING.addToCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine inline-flex items-center justify-center gap-2.5 bg-w-btn hover:bg-w-btn-hover text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <CalendarPlus className="w-5 h-5" aria-hidden />
                Thêm vào lịch
              </a>
            </Reveal>
          )}

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <EventCard
              title={WEDDING.ceremony.name}
              time={WEDDING.ceremony.time}
              venue={WEDDING.ceremony.venue}
              date={WEDDING.date}
              delay={100}
              variant="left"
            />
            <EventCard
              title={WEDDING.intimateMeal.name}
              time={WEDDING.intimateMeal.time}
              venue={WEDDING.intimateMeal.venue}
              date={WEDDING.date}
              delay={200}
              variant="right"
            />
          </div>
          {([model.familyAddresses.groomFamily, model.familyAddresses.brideFamily].some((item) => item.address || item.mapsUrl)) && (
            <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2">
              {[model.familyAddresses.groomFamily, model.familyAddresses.brideFamily].map((item, index) =>
                item.address || item.mapsUrl ? (
                  <Reveal key={item.label} delay={250 + index * 50} variant={index === 0 ? 'left' : 'right'} className="card-wedding rounded-2xl p-6">
                    <AddressLink {...item} />
                  </Reveal>
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
