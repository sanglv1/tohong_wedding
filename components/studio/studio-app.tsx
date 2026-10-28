'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, ExternalLink, Loader2, LogOut } from 'lucide-react'
import { DetailFields } from '@/components/studio/detail-fields'
import { GuestDesk } from '@/components/studio/guest-desk'
import { ImageField, MultiImageButton } from '@/components/studio/image-field'
import type { WeddingContent } from '@/lib/content'
import { draftDiffersFromPublic, type SaveMode } from '@/lib/platform/save-plan'
import { normalizeSlug, slugError } from '@/lib/platform/slug'
import { TEMPLATES, templateById, type TemplateId } from '@/lib/platform/templates'
import type { InvitationRecord, PublicUser } from '@/lib/platform/types'
import { cn } from '@/lib/utils'

type Draft = {
  slug: string
  templateId: TemplateId
  content: WeddingContent
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving'; mode: SaveMode }
  | { kind: 'saved' }
  | { kind: 'error'; message: string; payTo?: string }

function toDraft(invitation: InvitationRecord): Draft {
  return {
    slug: invitation.pendingSlug || invitation.slug,
    templateId: templateById(invitation.templateId).id,
    content: invitation.content,
  }
}

function hasNames(content: WeddingContent) {
  const groom = (content.couple.groomShort || content.couple.groom).trim()
  const bride = (content.couple.brideShort || content.couple.bride).trim()
  return Boolean(groom && bride)
}

export function StudioApp({ user, invitation }: { user: PublicUser; invitation: InvitationRecord }) {
  const namedAtStart = hasNames(invitation.content)
  const [record, setRecord] = useState(invitation)
  const [draft, setDraft] = useState(() => structuredClone(toDraft(invitation)))
  const [saved, setSaved] = useState(() => structuredClone(toDraft(invitation)))
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slugTouched, setSlugTouched] = useState(namedAtStart)
  const [conflict, setConflict] = useState(false)
  const [live, setLive] = useState(0)

  const draftRef = useRef(draft)
  const recordRef = useRef(record)
  const dirtyRef = useRef(false)
  const revisionRef = useRef(invitation.revision)
  const conflictRef = useRef(false)
  const savingRef = useRef(false)
  const queueRef = useRef(Promise.resolve())
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const slugProblem = slugError(normalizeSlug(draft.slug))
  const ready = hasNames(draft.content) && !slugProblem
  const drift = draftDiffersFromPublic(record, draft)
  const current = templateById(draft.templateId)

  const changeDraft = useCallback((recipe: (current: Draft) => Draft) => {
    setDraft((prev) => {
      const next = recipe(prev)
      draftRef.current = next
      return next
    })
    dirtyRef.current = true
    setStatus({ kind: 'idle' })
  }, [])

  const flush = useCallback((mode: SaveMode) => {
    const run = async () => {
      if (conflictRef.current) return false
      if (mode === 'draft' && !dirtyRef.current) return true
      const snapshot = structuredClone(draftRef.current)
      const problem = slugError(normalizeSlug(snapshot.slug))
      const slug = problem && mode === 'unpublish' ? recordRef.current.slug : snapshot.slug
      if (problem && mode !== 'unpublish') {
        setStatus({ kind: 'error', message: problem })
        return false
      }
      if (mode === 'publish' && !hasNames(snapshot.content)) {
        setStatus({ kind: 'error', message: 'Điền tên chú rể và cô dâu trước khi xuất bản.' })
        return false
      }
      savingRef.current = true
      setStatus({ kind: 'saving', mode })
      try {
        const res = await fetch(`/api/studio/invitations/${invitation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            baseRevision: revisionRef.current,
            slug,
            templateId: snapshot.templateId,
            content: snapshot.content,
          }),
        })
        const data = (await res.json()) as { error?: string; invitation?: InvitationRecord }
        if (res.status === 409) {
          conflictRef.current = true
          setConflict(true)
          setStatus({ kind: 'error', message: data.error ?? 'Hãy tải lại trang' })
          return false
        }
        if (!res.ok || !data.invitation || data.invitation.id !== invitation.id) {
          setStatus({
            kind: 'error',
            message: data.error ?? 'Lưu thất bại',
            payTo: res.status === 402 ? `/gia?thiep=${invitation.id}` : undefined,
          })
          return false
        }
        revisionRef.current = data.invitation.revision
        const nextDraft = toDraft(data.invitation)
        setRecord(data.invitation)
        setSaved(structuredClone(nextDraft))
        setDraft((currentDraft) => {
          const unchanged = JSON.stringify(currentDraft) === JSON.stringify(snapshot)
          const next = unchanged ? structuredClone(nextDraft) : structuredClone(currentDraft)
          if (!unchanged && currentDraft.slug === snapshot.slug) next.slug = nextDraft.slug
          draftRef.current = next
          dirtyRef.current = JSON.stringify(next) !== JSON.stringify(nextDraft)
          return next
        })
        setStatus({ kind: 'saved' })
        return true
      } catch {
        setStatus({ kind: 'error', message: 'Không kết nối được máy chủ' })
        return false
      } finally {
        savingRef.current = false
      }
    }

    const next = queueRef.current.then(run, run)
    queueRef.current = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }, [invitation.id])

  useEffect(() => {
    draftRef.current = draft
    recordRef.current = record
    dirtyRef.current = dirty
  }, [draft, record, dirty])

  useEffect(() => {
    if (!dirty || conflict || slugProblem) return
    const timer = window.setTimeout(() => {
      void flush('draft')
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [conflict, dirty, draft, flush, slugProblem])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const snapshot = draftRef.current
      void fetch(`/api/studio/invitations/${invitation.id}/nhap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: snapshot.templateId, content: snapshot.content }),
      }).then((res) => {
        if (res.ok) setLive((value) => value + 1)
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [draft, invitation.id])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || savingRef.current) event.preventDefault()
    }
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void flush('draft')
      }
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush('draft')
    }
    window.addEventListener('beforeunload', warn)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('beforeunload', warn)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [flush])

  function setCoupleName(side: 'groom' | 'bride', value: string) {
    changeDraft((prev) => {
      const next = structuredClone(prev)
      const shortKey = side === 'groom' ? 'groomShort' : 'brideShort'
      const previousShort = next.content.couple[shortKey]
      next.content.couple[shortKey] = value
      if (!next.content.couple[side] || next.content.couple[side] === previousShort) {
        next.content.couple[side] = value
      }
      if (!slugTouched) {
        const groom = next.content.couple.groomShort || next.content.couple.groom
        const bride = next.content.couple.brideShort || next.content.couple.bride
        const auto = normalizeSlug(`${groom} ${bride}`)
        if (!slugError(auto)) next.slug = auto
      }
      return next
    })
  }

  function setWhen(date: string, time: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return
    changeDraft((prev) => {
      const next = structuredClone(prev)
      const prevTime = next.content.event.start.slice(11, 16)
      next.content.event.start = `${date}T${time}`
      const [hour, minute] = time.split(':').map(Number)
      let endHour = hour + 4
      let endDate = date
      if (endHour >= 24) {
        endHour -= 24
        const rolled = new Date(`${date}T00:00:00Z`)
        rolled.setUTCDate(rolled.getUTCDate() + 1)
        endDate = rolled.toISOString().slice(0, 10)
      }
      next.content.event.end = `${endDate}T${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      if (!next.content.event.ceremonyTime || next.content.event.ceremonyTime === prevTime) next.content.event.ceremonyTime = time
      return next
    })
  }

  async function leave(href: string) {
    const ok = await flush('draft')
    if (!ok) return
    go(href)
  }

  async function logout() {
    const ok = await flush('draft')
    if (!ok) return
    await fetch('/api/auth/logout', { method: 'POST' })
    go('/dang-nhap')
  }

  async function copyCard() {
    const ok = await flush('draft')
    if (!ok) return
    setStatus({ kind: 'saving', mode: 'draft' })
    try {
      const res = await fetch(`/api/studio/invitations/${invitation.id}/copy`, { method: 'POST' })
      const data = (await res.json()) as { error?: string; invitation?: { id: string } }
      if (!res.ok || !data.invitation) throw new Error(data.error ?? 'Không sao chép được')
      go(`/studio/${data.invitation.id}`)
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Không sao chép được' })
    }
  }

  async function removeCard() {
    if (!window.confirm('Xóa thiệp này? Nếu đã xuất bản, link cũ sẽ không mở được nữa.')) return
    const res = await fetch(`/api/studio/invitations/${invitation.id}`, { method: 'DELETE' })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setStatus({ kind: 'error', message: data.error ?? 'Không xóa được thiệp' })
      return
    }
    go('/studio')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/thiep/${record.slug}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const start = draft.content.event.start
  const datePart = /^\d{4}-\d{2}-\d{2}/.test(start) ? start.slice(0, 10) : ''
  const timePart = /T\d{2}:\d{2}/.test(start) ? start.slice(11, 16) : '10:00'
  const groomShown = draft.content.couple.groomShort || draft.content.couple.groom
  const brideShown = draft.content.couple.brideShort || draft.content.couple.bride
  const saving = status.kind === 'saving'

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f3efe7]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => void leave('/studio')} className="min-h-11 shrink-0 text-sm text-stone-600">
              ← Danh sách
            </button>
            <p className="truncate text-xs text-stone-500">
              {current.name} · @{user.username}
            </p>
            <button type="button" onClick={() => void logout()} className="inline-flex min-h-11 min-w-11 items-center justify-center text-stone-500" aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusText status={status} dirty={dirty} drift={drift} published={record.published} />
            <button type="button" onClick={() => setPreview(true)} className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-3 text-sm lg:hidden">
              Xem trước
            </button>
            {record.published && (
              <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-stone-300 px-3 text-sm">
                <Copy className="h-4 w-4" /> {copied ? 'Đã chép' : 'Chép link'}
              </button>
            )}
            <button
              type="button"
              onClick={() => void flush('publish')}
              disabled={!ready || saving || conflict}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-stone-900 px-4 text-sm text-white disabled:opacity-50"
            >
              {status.kind === 'saving' && status.mode === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {record.published ? 'Cập nhật' : 'Xuất bản'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <form
          className="pb-24"
          onSubmit={(event) => {
            event.preventDefault()
            if (ready) void flush('publish')
          }}
        >
          <section>
            <h2 className="font-invite text-3xl">1. Chọn mẫu</h2>
            <p className="mt-1 text-sm text-stone-500">Đổi mẫu giữ chữ đã viết, và gắn hiệu ứng mở cùng bài nhạc của mẫu đó. Bạn vẫn đổi được ở phần nhạc. Khách chỉ thấy mẫu mới sau khi bạn bấm Cập nhật.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  aria-pressed={draft.templateId === template.id}
                  onClick={() => changeDraft((prev) => {
                    if (prev.templateId === template.id) return prev
                    return {
                      ...prev,
                      templateId: template.id,
                      content: {
                        ...prev.content,
                        opening: template.opening,
                        music: { playlist: [template.track], volume: prev.content.music?.volume ?? 0.5 },
                      },
                    }
                  })}
                  className={cn(
                    'rounded-2xl border bg-white p-2 text-left',
                    draft.templateId === template.id ? 'border-stone-900 ring-2 ring-stone-900' : 'border-stone-200',
                  )}
                >
                  <span className="block h-9 rounded-lg" style={{ background: template.swatch }} />
                  <span className="mt-1.5 block truncate text-xs font-medium">{template.name}</span>
                  <span className="block truncate text-[10px] text-stone-500">{template.mood}</span>
                </button>
              ))}
            </div>
          </section>

          <Section title="2. Viết thiệp">
            <p className="text-sm leading-6 text-stone-500">Tên, ngày và nơi tổ chức là đủ để xuất bản. Phần còn lại để sau. Bản nháp tự lưu, không tự xuất bản.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Tên chú rể" value={groomShown} placeholder="Hoàng Long" onChange={(value) => setCoupleName('groom', value)} />
              <TextField label="Tên cô dâu" value={brideShown} placeholder="Lan Chi" onChange={(value) => setCoupleName('bride', value)} />
              <TextField label="Ngày" type="date" value={datePart} onChange={(value) => setWhen(value, timePart)} />
              <TextField label="Giờ" type="time" value={timePart} onChange={(value) => setWhen(datePart, value)} />
            </div>
            <TextArea label="Địa điểm" value={draft.content.event.location} placeholder="Số 12 phố Hàng Bông, Hoàn Kiếm, Hà Nội" onChange={(value) => changeDraft((prev) => {
              const next = structuredClone(prev)
              next.content.event.location = value
              return next
            })} />
            <ImageField label="Ảnh chính" kind="photo" value={draft.content.hero.src} onChange={(value) => changeDraft((prev) => {
              const next = structuredClone(prev)
              next.content.hero.src = value
              return next
            })} />
          </Section>

          <Section title="3. Album ảnh">
            <p className="text-sm leading-6 text-stone-500">Cách hiện album và hộp mừng theo mẫu đang chọn. Tối đa 12 ảnh. Chưa có ảnh thì mục này ẩn trên thiệp.</p>
            {draft.content.gallery.length === 0 && (
              <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-6 text-sm text-stone-500">Chưa có ảnh trong album.</p>
            )}
            {draft.content.gallery.map((photo, index) => (
              <div key={`${photo.src}-${index}`} className="rounded-2xl border border-stone-200 bg-white p-3">
                <ImageField
                  label={`Ảnh ${index + 1}`}
                  kind="photo"
                  value={photo.src}
                  onChange={(value) => changeDraft((prev) => {
                    const next = structuredClone(prev)
                    next.content.gallery[index].src = value
                    return next
                  })}
                />
                <TextField
                  label="Chú thích"
                  value={photo.caption}
                  placeholder="Ví dụ: Ngày cầu hôn"
                  onChange={(value) => changeDraft((prev) => {
                    const next = structuredClone(prev)
                    next.content.gallery[index].caption = value
                    return next
                  })}
                />
                <button type="button" className="min-h-11 text-sm text-stone-500 underline" onClick={() => changeDraft((prev) => {
                  const next = structuredClone(prev)
                  next.content.gallery.splice(index, 1)
                  return next
                })}>
                  Xóa ảnh này
                </button>
              </div>
            ))}
            {draft.content.gallery.length >= 12 && <p className="text-sm text-stone-500">Album đã đủ 12 ảnh.</p>}
            <MultiImageButton
              label="Thêm ảnh album"
              room={12 - draft.content.gallery.length}
              onUploaded={(urls) => changeDraft((prev) => {
                const next = structuredClone(prev)
                for (const src of urls) next.content.gallery.push({ src, alt: 'Ảnh cưới', caption: '' })
                return next
              })}
            />
          </Section>

          <Section title="4. Hộp mừng cưới">
            <p className="text-sm leading-6 text-stone-500">Mỗi người một phong bì: mã QR, ngân hàng và số tài khoản. Có QR hoặc số tài khoản thì hộp mừng hiện trên thiệp.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <GiftFields label="Chú rể" value={draft.content.gift.groom} onChange={(gift) => changeDraft((prev) => {
                const next = structuredClone(prev)
                next.content.gift.groom = gift
                return next
              })} />
              <GiftFields label="Cô dâu" value={draft.content.gift.bride} onChange={(gift) => changeDraft((prev) => {
                const next = structuredClone(prev)
                next.content.gift.bride = gift
                return next
              })} />
            </div>
          </Section>

          <DetailFields
            content={draft.content}
            templateId={draft.templateId}
            onContent={(edit) => changeDraft((prev) => {
              const next = structuredClone(prev)
              edit(next.content)
              return next
            })}
          />

          <section className="mt-8 rounded-[1.5rem] bg-white p-4">
            <h2 className="font-invite text-3xl">9. Xuất bản</h2>
            <ul className="mt-3 space-y-1 text-sm">
              <CheckRow done={hasNames(draft.content)} label="Tên chú rể và cô dâu" />
              <CheckRow done={Boolean(datePart)} label="Ngày giờ" />
              <CheckRow done={Boolean(draft.content.event.location.trim())} label="Địa điểm" />
            </ul>
            <div className="mt-4">
              <TextField
                label="Đường dẫn"
                value={draft.slug}
                placeholder="hoang-long-lan-chi"
                onChange={(value) => {
                  setSlugTouched(true)
                  changeDraft((prev) => ({ ...prev, slug: value }))
                }}
              />
              {slugProblem ? (
                <p className="mt-1 text-sm text-amber-800">{slugProblem}</p>
              ) : record.published && draft.slug !== record.slug ? (
                <p className="mt-1 text-sm text-stone-500">
                  Khách vẫn mở /thiep/{record.slug}. Đường dẫn mới áp dụng khi bấm Cập nhật.
                </p>
              ) : (
                <p className="mt-1 text-sm text-stone-500">Khách mở /thiep/{record.published ? record.slug : draft.slug || '…'}</p>
              )}
            </div>
            {!hasNames(draft.content) && <p className="mt-3 text-sm text-amber-800">Điền tên hai bạn để xuất bản.</p>}
            {conflict && (
              <button type="button" onClick={() => window.location.reload()} className="mt-3 text-sm underline">
                Tải lại bản mới nhất
              </button>
            )}
            {record.published && (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-3 py-3">
                <p className="text-sm font-medium text-emerald-900">Thiệp đang mở cho khách.</p>
                <p className="mt-1 truncate text-sm text-emerald-800">/thiep/{record.slug}</p>
                {drift && <p className="mt-1 text-sm text-amber-800">Khách chưa thấy phần vừa sửa. Bấm Cập nhật để áp dụng.</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-11 items-center rounded-full bg-emerald-800 px-3 text-sm text-white">
                    {copied ? 'Đã chép link' : 'Chép link'}
                  </button>
                  <a href={`/thiep/${record.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-1 rounded-full border border-emerald-800 px-3 text-sm text-emerald-900">
                    <ExternalLink className="h-3.5 w-3.5" /> Mở thiệp
                  </a>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" disabled={!ready || saving || conflict} className="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-4 text-sm text-white disabled:opacity-50">
                {record.published ? 'Cập nhật thiệp' : 'Xuất bản và lấy link'}
              </button>
              <button type="button" onClick={() => void flush('draft')} disabled={saving || conflict || !dirty} className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm disabled:opacity-50">
                Lưu nháp
              </button>
              {record.published && (
                <button type="button" onClick={() => void flush('unpublish')} disabled={saving || conflict} className="inline-flex min-h-11 items-center text-sm text-stone-500 underline decoration-stone-300 underline-offset-4">
                  Gỡ link, chỉ mình xem
                </button>
              )}
            </div>
          </section>

          <GuestDesk
            invitationId={invitation.id}
            slug={record.slug}
            groom={groomShown || 'chú rể'}
            bride={brideShown || 'cô dâu'}
            when={draft.content.event.start.replace('T', ' ')}
            published={record.published}
          />

          <div className="mt-8 flex flex-wrap gap-4 border-t border-stone-200 pt-6">
            <button type="button" onClick={() => void copyCard()} className="inline-flex min-h-11 items-center text-sm underline decoration-stone-300 underline-offset-4">
              Sao chép thành bản nháp mới
            </button>
            <button type="button" onClick={() => void removeCard()} className="inline-flex min-h-11 items-center text-sm text-red-700">
              Xóa thiệp này
            </button>
          </div>
        </form>

        <aside className="sticky top-28 hidden h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-xl ring-1 ring-black/5 lg:flex">
          <p className="shrink-0 border-b border-stone-200 px-4 py-2 text-xs leading-5 text-stone-600">
            Bản bạn đang sửa. Khách vẫn xem bản đã xuất bản cho đến khi bạn bấm Cập nhật.
          </p>
          <iframe key={`${record.revision}-${live}`} title="Bản đang sửa" src={`/xem/${invitation.id}?nhap=1`} className="min-h-0 w-full flex-1 border-0" />
        </aside>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40">
          <div className="sticky top-0 z-10 flex justify-end p-3">
            <button type="button" onClick={() => setPreview(false)} className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm">
              Đóng
            </button>
          </div>
          <iframe key={`${record.revision}-${live}`} title="Bản đang sửa" src={`/xem/${invitation.id}?nhap=1`} className="min-h-[100dvh] w-full border-0 bg-white" />
        </div>
      )}
    </div>
  )
}

function go(href: string) {
  window.location.assign(href)
}

function CheckRow({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={done ? 'text-emerald-800' : 'text-stone-500'}>
      {done ? '✓' : '○'} {label}
    </li>
  )
}

function StatusText({ status, dirty, drift, published }: { status: Status; dirty: boolean; drift: boolean; published: boolean }) {
  if (status.kind === 'saving') {
    const label = status.mode === 'publish' ? 'Đang xuất bản…' : status.mode === 'unpublish' ? 'Đang gỡ link…' : 'Đang lưu nháp…'
    return <span className="text-xs text-stone-500" role="status">{label}</span>
  }
  if (status.kind === 'error') {
    return (
      <span className="max-w-64 text-xs text-red-700" role="alert">
        {status.message}
        {status.payTo && (
          <>
            {' '}
            <a href={status.payTo} className="underline">Mở trang thanh toán</a>
          </>
        )}
      </span>
    )
  }
  if (dirty) return <span className="text-xs text-amber-800" role="status">Chưa lưu</span>
  if (drift) return <span className="text-xs text-amber-800" role="status">Đã lưu nháp · khách chưa thấy phần mới</span>
  if (published && status.kind === 'saved') return <span className="text-xs text-emerald-700" role="status">Đã xuất bản</span>
  if (status.kind === 'saved') return <span className="text-xs text-emerald-700" role="status">Đã lưu nháp</span>
  if (published) return <span className="text-xs text-emerald-700" role="status">Đã xuất bản</span>
  return <span className="text-xs text-stone-500" role="status">Bản nháp</span>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-stone-200 pt-6">
      <h2 className="font-invite text-3xl">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-400 sm:text-sm"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-400 sm:text-sm"
      />
    </label>
  )
}

function GiftFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: WeddingContent['gift']['groom']
  onChange: (value: WeddingContent['gift']['groom']) => void
}) {
  const set = (key: keyof WeddingContent['gift']['groom'], next: string) => onChange({ ...value, [key]: next })
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-3">
      <p className="text-sm font-medium">{label}</p>
      <TextField label="Ngân hàng" value={value.bankName} onChange={(next) => set('bankName', next)} />
      <TextField label="Số tài khoản" value={value.accountNumber} onChange={(next) => set('accountNumber', next)} />
      <TextField label="Chủ tài khoản" value={value.accountName} onChange={(next) => set('accountName', next)} />
      <ImageField label={`Mã QR ${label.toLowerCase()}`} kind="qr" fit="contain" value={value.qrPath} onChange={(next) => set('qrPath', next)} />
    </div>
  )
}
