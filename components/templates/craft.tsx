/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react'
import type { InviteView } from '@/lib/platform/view'
import { HeroPhoto } from './parts'

const CORNER = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2 rotate-90',
  'bottom-right': 'right-2 bottom-2 rotate-180',
  'bottom-left': 'bottom-2 left-2 -rotate-90',
} as const

export function Corners({ className = '' }: { className?: string }) {
  return (
    <>
      {(Object.keys(CORNER) as (keyof typeof CORNER)[]).map((place) => (
        <svg
          key={place}
          viewBox="0 0 80 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className={`pointer-events-none absolute h-12 w-12 sm:h-16 sm:w-16 ${CORNER[place]} ${className}`}
          aria-hidden
        >
          <path d="M4 44V12a8 8 0 0 1 8-8h32" />
          <path d="M11 54V19a8 8 0 0 1 8-8h35" opacity="0.55" />
          <path d="M19 19c10 0 16 6 16 16-10 0-16-6-16-16Z" fill="currentColor" fillOpacity="0.16" />
          <path d="M26 12c4-4 10-5 14-2-4 4-10 5-14 2Z" fill="currentColor" fillOpacity="0.28" />
          <path d="M12 26c-4 4-5 10-2 14 4-4 5-10 2-14Z" fill="currentColor" fillOpacity="0.28" />
          <circle cx="19" cy="19" r="2.1" fill="currentColor" stroke="none" />
        </svg>
      ))}
    </>
  )
}

export function Flourish({ className = '', start = false }: { className?: string; start?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${start ? 'justify-start' : 'justify-center'} ${className}`} aria-hidden>
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-current sm:w-14" />
      <svg viewBox="0 0 24 12" className="h-4 w-9 fill-current">
        <path d="M1 6l3-3 3 3-3 3z" />
        <path d="M17 6l3-3 3 3-3 3z" />
        <circle cx="12" cy="6" r="1.7" />
      </svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-current sm:w-14" />
    </div>
  )
}

export function Kicker({ children, className = '' }: { children: string; className?: string }) {
  return <p className={`text-[11px] tracking-[0.32em] uppercase ${className}`}>{children}</p>
}

export function CoupleNames({
  invite,
  nameClass = 'font-invite text-[2.7rem] leading-[1.05] sm:text-6xl',
  ampClass = 'my-1 font-invite text-3xl',
  amp = '&',
}: {
  invite: InviteView
  nameClass?: string
  ampClass?: string
  amp?: string
}) {
  return (
    <h1 className="text-balance">
      <span className={`block ${nameClass}`}>{invite.names.groom}</span>
      <span className={`block ${ampClass}`} aria-hidden={amp.trim() ? undefined : true}>
        {amp}
      </span>
      <span className={`block ${nameClass}`}>{invite.names.bride}</span>
    </h1>
  )
}

export function DateLockup({ invite, dayClass = '' }: { invite: InviteView; dayClass?: string }) {
  if (!invite.date) return null
  return (
    <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
      <span className="w-[5.5rem] text-right text-[0.68rem] tracking-[0.16em] uppercase sm:w-24 sm:text-xs">{invite.date.weekday}</span>
      <span className={`border-x border-current/45 px-3 font-invite text-5xl leading-none tabular-nums sm:px-4 sm:text-6xl ${dayClass}`}>
        {invite.date.day}
      </span>
      <span className="w-[5.5rem] text-left text-[0.68rem] tracking-[0.16em] uppercase sm:w-24 sm:text-xs">
        Tháng {invite.date.month}
        <br />
        {invite.date.year}
      </span>
    </div>
  )
}

export function When({ invite, className = '' }: { invite: InviteView; className?: string }) {
  if (!invite.lunar && !invite.date?.time) return null
  return (
    <div className={className}>
      {invite.lunar && <p className="text-sm italic opacity-80">{invite.lunar}</p>}
      {invite.date?.time && <p className="mt-1 text-sm">Vào lúc {invite.date.time.toLocaleLowerCase('vi')}</p>}
    </div>
  )
}

export function Paper({
  children,
  line,
  wash,
  className = '',
}: {
  children: ReactNode
  line: string
  wash: string
  className?: string
}) {
  return (
    <div className={`rounded-[1.15rem] border p-1.5 shadow-[0_22px_50px_-28px_rgb(30_16_8/0.55)] ${line} ${wash} ${className}`}>
      <div className={`relative rounded-[0.75rem] border px-5 py-12 outline outline-1 outline-offset-[-7px] sm:px-8 sm:py-14 ${line}`}>
        {children}
      </div>
    </div>
  )
}

export function PhotoWell({
  invite,
  className = '',
  imgClass,
  empty,
  plain = false,
}: {
  invite: InviteView
  className?: string
  imgClass: string
  empty?: ReactNode
  plain?: boolean
}) {
  const photo = invite.photos[0]
  if (!photo && plain) {
    return <div className={`flex items-center justify-center ${className}`}>{empty}</div>
  }
  return (
    <div className={`relative overflow-hidden bg-[#2a1a14] shadow-[0_12px_28px_-16px_rgb(40_16_8/0.7)] ${className}`}>
      {photo ? (
        <HeroPhoto
          src={photo.src}
          alt={photo.alt}
          focus={photo.focus}
          className={imgClass}
          fallback={<div className={`flex items-center justify-center ${imgClass}`}>{empty}</div>}
        />
      ) : (
        <div className={`flex items-center justify-center ${imgClass}`}>{empty}</div>
      )}
      <span className="pointer-events-none absolute inset-2 rounded-[inherit] border border-white/50" aria-hidden />
    </div>
  )
}

function Heading({ children, align }: { children: string; align: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <h2 className="font-invite text-4xl sm:text-5xl">{children}</h2>
      <Flourish className="mt-3 opacity-80" start={align === 'left'} />
    </div>
  )
}

function filled(event: InviteView['ceremony']) {
  return Boolean(event.name || event.time || event.venue)
}

export function InviteRest({
  invite,
  panel,
  link,
  hideHero = false,
  align = 'center',
}: {
  invite: InviteView
  panel: string
  link: string
  hideHero?: boolean
  align?: 'center' | 'left'
}) {
  const events = [invite.ceremony, invite.meal].filter(filled)
  const gallery = hideHero ? invite.photos.slice(1) : invite.photos
  const lead = hideHero ? undefined : gallery[0]
  const thumbs = lead ? gallery.slice(1) : gallery
  const text = align === 'left' ? 'text-left' : 'text-center'
  return (
    <div>
      {invite.story && (
        <section className="mt-4">
          <Heading align={align}>{invite.storyTitle || 'Câu chuyện'}</Heading>
          <p className={`mx-auto mt-6 max-w-2xl text-base leading-8 text-pretty sm:text-lg ${text}`}>{invite.story}</p>
          {invite.timeline.length > 0 && (
            <ol className="mx-auto mt-8 max-w-md space-y-5 border-l border-current/25 pl-5 text-left">
              {invite.timeline.map((item) => (
                <li key={`${item.date}-${item.event}`}>
                  {item.date && <p className="text-xs tracking-[0.18em] uppercase opacity-60">{item.date}</p>}
                  {item.event && <p className="mt-1 leading-7">{item.event}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {invite.parents.length > 0 && (
        <section className="mt-16">
          <Heading align={align}>Gia đình hai bên</Heading>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {invite.parents.map((group) => (
              <div key={group.label} className={panel}>
                <h3 className="text-center font-invite text-3xl">{group.label}</h3>
                <dl className="mx-auto mt-5 grid w-fit grid-cols-[auto_auto] gap-x-4 gap-y-2 text-left">
                  {group.people.map((person) => (
                    <div key={`${group.label}-${person.role}`} className="contents">
                      <dt className="text-sm opacity-60">{person.role}</dt>
                      <dd className="font-medium">{person.name}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mt-16">
          <Heading align={align}>Lịch trình</Heading>
          {invite.date && <p className={`mt-4 text-sm opacity-70 ${text}`}>{invite.date.full}</p>}
          <div className={`mt-6 grid gap-4 ${events.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {events.map((event) => (
              <div key={event.name || event.time} className={panel}>
                {event.name && <h3 className="font-invite text-3xl">{event.name}</h3>}
                {event.time && (
                  <p className="mt-4 text-sm">
                    <span className="block text-[11px] tracking-[0.2em] uppercase opacity-55">Thời gian</span>
                    <span className="mt-1 block text-base">{event.time}</span>
                  </p>
                )}
                {event.venue && (
                  <p className="mt-3 text-sm">
                    <span className="block text-[11px] tracking-[0.2em] uppercase opacity-55">Địa điểm</span>
                    <span className="mt-1 block text-base leading-7">{event.venue}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          {(invite.map || invite.calendar) && (
            <div className={`mt-5 flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
              {invite.map && (
                <a className={link} href={invite.map} target="_blank" rel="noreferrer">
                  Xem bản đồ
                </a>
              )}
              {invite.calendar && (
                <a className={link} href={invite.calendar} target="_blank" rel="noreferrer">
                  Thêm vào lịch
                </a>
              )}
            </div>
          )}
        </section>
      )}

      {(invite.location || invite.brideHome) && (
        <section className="mt-16">
          <Heading align={align}>Nơi sum họp</Heading>
          <div className={`mt-8 ${panel} ${text}`}>
            {invite.location && <p className="text-lg leading-8 text-pretty">{invite.location}</p>}
            {invite.brideHome && <p className="mt-3 text-sm leading-7 opacity-75">Nhà gái: {invite.brideHome}</p>}
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="mt-16">
          <Heading align={align}>Khoảnh khắc</Heading>
          {lead && (
            <figure className="mt-8">
              <HeroPhoto
                src={lead.src}
                alt={lead.alt}
                focus={lead.focus}
                className="aspect-[4/5] w-full object-cover sm:aspect-[16/10]"
                fallback={null}
              />
              {lead.caption && <figcaption className="mt-2 text-center text-sm opacity-70">{lead.caption}</figcaption>}
            </figure>
          )}
          {thumbs.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {thumbs.slice(0, 6).map((photo) => (
                <figure key={photo.src}>
                  <HeroPhoto src={photo.src} alt={photo.alt} focus={photo.focus} className="aspect-square w-full object-cover" />
                  {photo.caption && <figcaption className="mt-1 text-xs opacity-70">{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {invite.gifts.length > 0 && (
        <section className="mt-16">
          <Heading align={align}>Mừng cưới</Heading>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {invite.gifts.map((gift) => (
              <div key={gift.label} className={`${panel} text-left`}>
                <p className="text-[11px] tracking-[0.22em] uppercase opacity-60">{gift.label}</p>
                {gift.holder && <p className="mt-3 font-invite text-2xl leading-tight">{gift.holder}</p>}
                {gift.bank && <p className="mt-2 text-sm opacity-75">{gift.bank}</p>}
                {gift.number && <p className="mt-1 font-mono text-sm tracking-wider">{gift.number}</p>}
                {gift.qr && <img src={gift.qr} alt={`Mã QR ${gift.label}`} className="mt-4 h-32 w-32 bg-white object-contain p-1" />}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 pb-6 text-center">
        <Flourish />
        <p className="mt-6 font-invite text-3xl">{invite.names.groom}</p>
        <p className="font-invite text-2xl opacity-70">&</p>
        <p className="font-invite text-3xl">{invite.names.bride}</p>
        {invite.date && <p className="mt-3 text-xs tracking-[0.28em] uppercase opacity-60">{invite.date.full}</p>}
      </footer>
    </div>
  )
}

export function Wave() {
  return (
    <svg viewBox="0 0 1440 80" className="absolute right-0 bottom-0 left-0 h-16 w-full text-[#f6f1e8]" preserveAspectRatio="none" aria-hidden>
      <path fill="currentColor" d="M0 42c180-36 300 28 480 8s300-40 480-8 280 36 480 4v34H0z" />
    </svg>
  )
}

export function Lotus({ className = 'text-[#6e8f78]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 46" className={`mx-auto h-14 w-24 ${className}`} aria-hidden>
      <path d="M40 44c0-12 6-20 16-22-8 1-12-5-12-16 0 11-4 17-12 16 10 2 16 10 8 22z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M40 44c-2-10-10-16-22-16 8 2 12 8 12 18" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M40 44c2-10 10-16 22-16-8 2-12 8-12 18" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
