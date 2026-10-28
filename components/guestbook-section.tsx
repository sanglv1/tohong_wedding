'use client'

import { useCallback, useEffect, useState } from 'react'
import { Heart, MessageCircleHeart, Send } from 'lucide-react'
import { GUESTBOOK_LIMITS, fetchGuestbook, postGuestbook, type GuestbookEntry } from '@/lib/guestbook'
import { useGuestName } from '@/hooks/use-guest-name'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

function initialOf(name: string) {
  const words = name.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/)
  return (words[words.length - 1]?.[0] ?? '♥').toUpperCase()
}

function WishCard({ entry, isNew }: { entry: GuestbookEntry; isNew: boolean }) {
  return (
    <li className={`wish-card ${isNew ? 'wish-new' : ''}`}>
      <span className="wish-quote" aria-hidden>
        &ldquo;
      </span>
      <p className="relative text-w-text leading-relaxed whitespace-pre-line break-words">{entry.message}</p>
      <div className="relative mt-4 flex items-center gap-3">
        <span
          className="wish-avatar w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold"
          aria-hidden
        >
          {initialOf(entry.name)}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-w-strong truncate">{entry.name}</p>
          <p className="text-xs text-w-muted">{formatDate(entry.createdAt)}</p>
        </div>
      </div>
    </li>
  )
}

/** enabled: server đã có biến kết nối Upstash Redis */
export function GuestbookSection({ enabled: isGuestbookEnabled, endpoint = '/api/guestbook', demo = false }: { enabled: boolean; endpoint?: string; demo?: boolean }) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const guestName = useGuestName()
  const [editedName, setName] = useState<string | null>(null)
  const name = editedName ?? guestName ?? ''
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoadState('loading')
    try {
      setEntries(await fetchGuestbook(endpoint))
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [endpoint])

  useEffect(() => {
    if (!isGuestbookEnabled || demo) {
      if (demo) setLoadState('ready')
      return
    }
    let cancelled = false
    fetchGuestbook(endpoint)
      .then((data) => {
        if (cancelled) return
        setEntries(data)
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [isGuestbookEnabled, endpoint, demo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedMessage = message.trim()
    if (!trimmedName || !trimmedMessage) return

    setSubmitState('sending')
    setErrorText('')
    try {
      if (demo) throw new Error('Đây là mẫu xem thử. Lời chúc chỉ lưu trên thiệp đã xuất bản.')
      const saved = await postGuestbook({ name: trimmedName, message: trimmedMessage, website }, endpoint)
      const entry = saved ?? { name: trimmedName, message: trimmedMessage, createdAt: new Date().toISOString() }
      setEntries((prev) => [entry, ...prev])
      setNewKey(entry.createdAt)
      setLoadState('ready')
      setMessage('')
      setSubmitState('sent')
    } catch (err) {
      setSubmitState('error')
      const reason = err instanceof Error && /nhanh|nhập/.test(err.message) ? err.message : ''
      setErrorText(reason || 'Chưa gửi được lời chúc. Vui lòng thử lại sau ít phút.')
    }
  }

  if (!isGuestbookEnabled && process.env.NODE_ENV !== 'development') return null

  return (
    <section id="loi-chuc" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="section-frame">
          <SectionHeading
            icon={<MessageCircleHeart className="w-7 h-7" aria-hidden />}
            description="Mỗi lời chúc của bạn là một món quà quý giá dành cho chúng mình"
          >
            Sổ lưu bút
          </SectionHeading>

          {!isGuestbookEnabled && (
            <div className="error-wedding mb-6 text-sm leading-relaxed" role="note">
              <strong>Chưa kết nối Upstash Redis</strong> (chỉ hiện khi chạy dev). Thêm <code>KV_REST_API_URL</code> và{' '}
              <code>KV_REST_API_TOKEN</code> vào <code>.env.local</code> (xem README) rồi khởi động lại server.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
            <Reveal className="guestbook-panel md:sticky md:top-24 p-6 sm:p-7">
              <h3 className="font-serif text-3xl text-w-strong text-center mb-1">Gửi lời chúc</h3>
              <div className="flex items-center justify-center gap-2 mb-6" aria-hidden>
                <span className="h-px w-10 bg-w-gold/60" />
                <Heart className="w-3.5 h-3.5 text-w-gold fill-current" />
                <span className="h-px w-10 bg-w-gold/60" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="gb-name" className="block text-sm font-medium text-w-text mb-2">
                    Tên của bạn
                  </label>
                  <input
                    id="gb-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={GUESTBOOK_LIMITS.name}
                    required
                    autoComplete="name"
                    placeholder="Ví dụ: Minh - bạn đại học"
                    className="field-wedding"
                  />
                </div>
                <div>
                  <label htmlFor="gb-message" className="block text-sm font-medium text-w-text mb-2">
                    Lời chúc
                  </label>
                  <textarea
                    id="gb-message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      if (submitState !== 'sending') setSubmitState('idle')
                    }}
                    maxLength={GUESTBOOK_LIMITS.message}
                    required
                    rows={4}
                    placeholder="Chúc hai bạn trăm năm hạnh phúc..."
                    className="field-wedding resize-none"
                  />
                  <p className="text-xs text-w-muted text-right mt-1">
                    {message.length}/{GUESTBOOK_LIMITS.message}
                  </p>
                </div>
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />

                <div aria-live="polite">
                  {submitState === 'sent' && (
                    <p className="text-sm text-center text-w-text">Cảm ơn bạn đã gửi lời chúc!</p>
                  )}
                  {submitState === 'error' && (
                    <p className="error-wedding text-center" role="alert">
                      {errorText}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isGuestbookEnabled || submitState === 'sending'}
                  className="btn-shine w-full inline-flex items-center justify-center gap-2 bg-w-btn hover:bg-w-btn-hover text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                >
                  <Send className="w-4 h-4" aria-hidden />
                  {submitState === 'sending' ? 'Đang gửi...' : 'Gửi lời chúc'}
                </button>
              </form>
            </Reveal>

            {isGuestbookEnabled && (
              <Reveal delay={150}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-serif text-3xl text-w-strong">Lời chúc</h3>
                  {entries.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-w-muted">
                      <Heart className="w-4 h-4 text-w-gold fill-current" aria-hidden />
                      {entries.length} lời chúc
                    </span>
                  )}
                </div>

                <div aria-live="polite" aria-busy={loadState === 'loading'}>
                  {loadState === 'loading' && entries.length === 0 && (
                    <ul className="space-y-4" aria-hidden>
                      {[0, 1].map((i) => (
                        <li key={i} className="wish-card animate-pulse">
                          <div className="h-3 rounded bg-w-tint w-4/5 mb-2" />
                          <div className="h-3 rounded bg-w-tint w-3/5 mb-5" />
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-w-tint" />
                            <div className="h-3 rounded bg-w-tint w-24" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {loadState === 'error' && entries.length === 0 && (
                    <div className="wish-card text-center text-w-muted text-sm py-8">
                      Không tải được lời chúc.{' '}
                      <button type="button" onClick={reload} className="underline font-medium text-w-text">
                        Thử lại
                      </button>
                    </div>
                  )}
                  {loadState === 'ready' && entries.length === 0 && (
                    <div className="wish-card text-center py-10">
                      <MessageCircleHeart className="w-10 h-10 mx-auto text-w-gold mb-3" aria-hidden />
                      <p className="text-w-text font-medium">Chưa có lời chúc nào</p>
                      <p className="text-sm text-w-muted mt-1">Hãy là người đầu tiên gửi lời chúc nhé!</p>
                    </div>
                  )}
                  {entries.length > 0 && (
                    <ul className="wish-scroll space-y-4 max-h-[36rem] overflow-y-auto pr-1 -mr-1">
                      {entries.map((entry, i) => (
                        <WishCard key={entry.id ?? `${entry.createdAt}-${i}`} entry={entry} isNew={entry.createdAt === newKey} />
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
