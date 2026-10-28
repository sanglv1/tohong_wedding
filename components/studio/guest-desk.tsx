'use client'

import { useEffect, useState } from 'react'
import { downloadCsv } from '@/components/admin/shared'
import { guestLink } from '@/lib/guest'
import type { GuestRecord } from '@/lib/guests'
import type { GuestbookEntry } from '@/lib/guestbook'
import type { RsvpEntry } from '@/lib/rsvp'
import { headcount } from '@/lib/rsvp'

type Desk = { rsvps: RsvpEntry[]; wishes: GuestbookEntry[]; guests: GuestRecord[] }

export function GuestDesk({
  invitationId,
  slug,
  groom,
  bride,
  when,
  published,
  endpoint,
}: {
  invitationId: string
  slug: string
  groom: string
  bride: string
  when: string
  published: boolean
  endpoint?: string
}) {
  const [desk, setDesk] = useState<Desk | null>(null)
  const [error, setError] = useState('')
  const [names, setNames] = useState('')
  const [pending, setPending] = useState(false)

  async function load() {
    const res = await fetch(endpoint ?? `/api/studio/invitations/${invitationId}/khach`, { cache: 'no-store' })
    const data = (await res.json()) as Desk & { error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Không tải được')
    setDesk({ rsvps: data.rsvps ?? [], wishes: data.wishes ?? [], guests: data.guests ?? [] })
  }

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Không tải được'))
  }, [invitationId, endpoint])

  async function act(body: Record<string, unknown>) {
    setPending(true)
    setError('')
    try {
      const res = await fetch(endpoint ?? `/api/studio/invitations/${invitationId}/khach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Không lưu được')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được')
    } finally {
      setPending(false)
    }
  }

  const path = `/thiep/${slug}`
  const rsvps = desk?.rsvps ?? []
  const guests = desk?.guests ?? []
  const coming = rsvps.filter((entry) => entry.attending).reduce((sum, entry) => sum + headcount(entry), 0)
  const groomComing = rsvps.filter((entry) => entry.attending && entry.side !== 'bride').reduce((sum, entry) => sum + headcount(entry), 0)
  const brideComing = rsvps.filter((entry) => entry.attending && entry.side === 'bride').reduce((sum, entry) => sum + headcount(entry), 0)
  const unopened = guests.filter((guest) => !guest.opens)

  return (
    <section className="mt-8 rounded-[1.5rem] bg-white p-4">
      <h2 className="font-invite text-3xl">Khách, xác nhận, lời chúc</h2>
      <p className="mt-1 text-sm leading-6 text-stone-500">
        {published ? 'Khách đang mở link đã xuất bản.' : 'Hãy xuất bản trước khi gửi link. Bản nháp chỉ bạn mở được.'}
      </p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <label className="mt-4 block text-sm">
        <span className="font-medium">Thêm khách, mỗi dòng một tên</span>
        <textarea
          value={names}
          onChange={(event) => setNames(event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          placeholder={'Anh Minh\nChị Lan'}
        />
      </label>
      <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm underline">
        Nhập từ file TXT hoặc CSV
        <input
          type="file"
          accept=".txt,.csv,text/plain,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            void file.text().then((text) => {
              const parsed = text
                .split(/\r?\n/)
                .flatMap((line) => line.split(','))
                .map((item) => item.trim().replace(/^"|"$/g, ''))
                .filter((item) => item && !/^tên$/i.test(item))
              setNames(parsed.join('\n'))
            })
          }}
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const list = names.split('\n')
          setNames('')
          void act({ action: 'add-guests', names: list })
        }}
        className="mt-2 min-h-11 rounded-full bg-stone-900 px-4 text-sm text-white disabled:opacity-50"
      >
        Thêm vào danh sách
      </button>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-2xl bg-stone-50 px-2 py-3">
          <p className="font-invite text-3xl">{groomComing}</p>
          <p className="text-stone-500">Nhà trai sẽ đến</p>
        </div>
        <div className="rounded-2xl bg-stone-50 px-2 py-3">
          <p className="font-invite text-3xl">{brideComing}</p>
          <p className="text-stone-500">Nhà gái sẽ đến</p>
        </div>
        <div className="rounded-2xl bg-stone-50 px-2 py-3">
          <p className="font-invite text-3xl">{unopened.length}</p>
          <p className="text-stone-500">Chưa mở thiệp</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-stone-500">
        {guests.length} khách mời · {rsvps.length} xác nhận · {coming} người sẽ đến · {desk?.wishes.length ?? 0} lời chúc
      </p>
      {unopened.length > 0 && (
        <p className="mt-2 text-sm text-stone-600">Chưa mở: {unopened.map((guest) => guest.name).join(', ')}</p>
      )}

      <ul className="mt-4 space-y-3">
        {guests.map((guest) => {
          const link = typeof window === 'undefined' ? path : guestLink(window.location.origin, guest.name, false, path)
          const message =
            `Trân trọng kính mời ${guest.name} tới dự lễ thành hôn của ${groom} & ${bride}` + (when ? ` vào ${when}` : '') + `.\n${link}`
          return (
            <li key={guest.key} className="rounded-2xl border border-stone-200 p-3 text-sm">
              <p className="font-medium">{guest.name}</p>
              <p className="text-stone-500">{guest.opens ? `Đã mở ${guest.opens.count} lần` : 'Chưa mở'}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" className="underline" onClick={() => void navigator.clipboard.writeText(message)}>
                  Chép lời mời
                </button>
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    void navigator.clipboard.writeText(message)
                    window.open('https://chat.zalo.me', '_blank', 'noopener,noreferrer')
                  }}
                >
                  Gửi qua Zalo
                </button>
                <button type="button" className="text-red-700" disabled={pending} onClick={() => void act({ action: 'delete-guest', key: guest.key })}>
                  Xóa
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {(desk?.rsvps.length ?? 0) > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">Xác nhận tham dự</h3>
            <button
              type="button"
              className="text-sm underline"
              onClick={() =>
                downloadCsv('xac-nhan.csv', [
                  ['Tên', 'Điện thoại', 'Tham dự', 'Nhà', 'Số người', 'Ghi chú'],
                  ...(desk?.rsvps ?? []).map((entry) => [
                    entry.name,
                    entry.phone,
                    entry.attending ? 'Có' : 'Không',
                    entry.side === 'bride' ? 'Nhà gái' : 'Nhà trai',
                    entry.guests,
                    entry.note,
                  ]),
                ])
              }
            >
              Tải CSV
            </button>
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {(desk?.rsvps ?? []).map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2">
                <span>
                  {entry.name} · {entry.phone} · {entry.attending ? `${entry.guests} người` : 'không đến'}
                </span>
                <button type="button" className="shrink-0 text-red-700" disabled={pending} onClick={() => void act({ action: 'delete-rsvp', entryId: entry.id })}>
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(desk?.wishes.length ?? 0) > 0 && (
        <ul className="mt-6 space-y-2 text-sm">
          {(desk?.wishes ?? []).map((wish) => (
            <li key={wish.id} className="rounded-xl bg-stone-50 px-3 py-2">
              <p className="font-medium">{wish.name}</p>
              <p className="whitespace-pre-line text-stone-600">{wish.message}</p>
              <button type="button" className="mt-1 text-red-700" disabled={pending} onClick={() => void act({ action: 'delete-wish', entryId: wish.id })}>
                Xóa lời chúc
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
