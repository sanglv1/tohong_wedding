'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useGuestName } from '@/hooks/use-guest-name'
import { normalizePhone, postRsvp, RSVP_GUEST_OPTIONS, VN_PHONE } from '@/lib/rsvp'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

/** Chỉ dùng khi chưa kết nối Upstash Redis */
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID

const INITIAL_FORM = {
  /** null = khách chưa sửa, dùng tên trong link mời */
  name: null as string | null,
  phone: '',
  attendance: 'yes' as 'yes' | 'no',
  side: 'groom' as 'groom' | 'bride',
  guests: '1',
  note: '',
}

async function postFormspree(payload: Record<string, string>) {
  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Gửi thất bại')
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 cursor-pointer accent-[var(--w-btn)]"
      />
      <span className="text-w-text">{children}</span>
    </label>
  )
}

export function RSVPForm({ endpoint = '/api/rsvp', demo = false }: { endpoint?: string; demo?: boolean }) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [gotcha, setGotcha] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const guestName = useGuestName()
  const name = formData.name ?? guestName ?? ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'phone') setPhoneError(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const phone = normalizePhone(formData.phone)
    if (!VN_PHONE.test(phone)) {
      setPhoneError('Số điện thoại chưa đúng, ví dụ: 0912 345 678')
      document.getElementById('rsvp-phone')?.focus()
      return
    }

    setStatus('submitting')
    if (demo) {
      setStatus('error')
      setError('Đây là mẫu xem thử. Xuất bản thiệp của bạn thì khách gửi được xác nhận.')
      return
    }
    const attending = formData.attendance === 'yes'
    try {
      try {
        await postRsvp({
          name: name.trim(),
          phone,
          attending,
          side: formData.side,
          guests: formData.guests,
          note: formData.note.trim(),
          invite: guestName ?? undefined,
          _gotcha: gotcha,
        }, endpoint)
      } catch (err) {
        const notConfigured = (err as { status?: number }).status === 503
        if (endpoint !== '/api/rsvp' || !notConfigured) throw err
        if (!FORMSPREE_ID) {
          throw new Error('Hệ thống xác nhận đang được cập nhật. Vui lòng báo trực tiếp cho cô dâu chú rể.')
        }
        await postFormspree({
          name: name.trim(),
          phone,
          attendance: attending ? 'Có, tôi sẽ tham dự' : 'Không, xin lỗi',
          side: formData.side === 'groom' ? 'Khách nhà trai' : 'Khách nhà gái',
          guests: attending ? formData.guests : '0',
          note: formData.note.trim() || '(Không có)',
          _subject: `Xác nhận tham dự: ${name.trim()}`,
          _gotcha: gotcha,
        })
      }
      setStatus('success')
      setFormData({ ...INITIAL_FORM, name: '' })
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error && err.message !== 'Failed to fetch' ? err.message : ''
      setError(message || 'Không thể gửi. Vui lòng kiểm tra kết nối mạng và thử lại.')
    }
  }

  const isAttending = formData.attendance === 'yes'

  return (
    <section id="xac-nhan" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="section-frame">
          <SectionHeading description="Vui lòng xác nhận để gia đình chuẩn bị chu đáo nhất">
            Xác nhận tham dự
          </SectionHeading>

          <Reveal className="card-wedding rounded-2xl p-6 sm:p-8 md:p-10">
            {status === 'success' ? (
              <div className="text-center py-8" role="status">
                <CheckCircle2 className="w-16 h-16 text-w-soft mx-auto mb-4" aria-hidden />
                <h3 className="text-xl font-semibold text-w-strong mb-2">Cảm ơn bạn đã xác nhận!</h3>
                <p className="text-w-muted mb-6">Gia đình đã nhận được thông tin của bạn.</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-sm font-medium text-w-text underline underline-offset-4"
                >
                  Gửi thêm xác nhận cho người khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="rsvp-name" className="block text-sm font-medium text-w-text mb-2">
                    Họ và tên *
                  </label>
                  <input
                    id="rsvp-name"
                    name="name"
                    value={name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên của bạn"
                    required
                    autoComplete="name"
                    maxLength={80}
                    className="field-wedding"
                  />
                </div>

                <div>
                  <label htmlFor="rsvp-phone" className="block text-sm font-medium text-w-text mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    id="rsvp-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0900 000 000"
                    required
                    autoComplete="tel"
                    aria-invalid={phoneError ? true : undefined}
                    aria-describedby={phoneError ? 'rsvp-phone-error' : undefined}
                    className="field-wedding"
                  />
                  {phoneError && (
                    <p id="rsvp-phone-error" className="error-wedding mt-2">
                      {phoneError}
                    </p>
                  )}
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-w-text mb-2">Bạn có thể tham dự không? *</legend>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <RadioOption name="attendance" value="yes" checked={isAttending} onChange={handleChange}>
                      Có, tôi sẽ tham dự
                    </RadioOption>
                    <RadioOption name="attendance" value="no" checked={!isAttending} onChange={handleChange}>
                      Rất tiếc, tôi không đến được
                    </RadioOption>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium text-w-text mb-2">Bạn là khách của *</legend>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <RadioOption name="side" value="groom" checked={formData.side === 'groom'} onChange={handleChange}>
                      Nhà trai
                    </RadioOption>
                    <RadioOption name="side" value="bride" checked={formData.side === 'bride'} onChange={handleChange}>
                      Nhà gái
                    </RadioOption>
                  </div>
                </fieldset>

                {isAttending && (
                  <div>
                    <label htmlFor="rsvp-guests" className="block text-sm font-medium text-w-text mb-2">
                      Số người tham dự (tính cả bạn)
                    </label>
                    <select
                      id="rsvp-guests"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      className="field-wedding"
                    >
                      {RSVP_GUEST_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n === '6+' ? 'Từ 6 người trở lên' : `${n} người`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="rsvp-note" className="block text-sm font-medium text-w-text mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    id="rsvp-note"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Ví dụ: ăn chay, đi cùng trẻ nhỏ..."
                    rows={3}
                    maxLength={500}
                    className="field-wedding resize-y"
                  />
                </div>

                <input
                  type="text"
                  name="_gotcha"
                  value={gotcha}
                  onChange={(e) => setGotcha(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />

                {error && (
                  <p className="error-wedding text-center" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn-shine w-full bg-w-btn hover:bg-w-btn-hover text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-70"
                >
                  {status === 'submitting' ? 'Đang gửi...' : 'Gửi xác nhận'}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
