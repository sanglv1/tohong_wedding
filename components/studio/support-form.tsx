'use client'

import { useState } from 'react'

export function SupportForm({ embedded = false }: { embedded?: boolean }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <div className={embedded ? 'mt-5' : 'mx-auto max-w-lg px-5 py-16'}>
      {!embedded && (
        <>
          <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">Hỗ trợ</p>
          <h1 className="mt-3 font-invite text-5xl">Thiệp đang gửi khách mà gặp lỗi</h1>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Link không mở, ảnh không hiện, hoặc khách không xác nhận được: gửi vào đây. Quản trị đọc trên bàn điều hành.
          </p>
        </>
      )}
      {done ? (
        <p className={embedded ? 'text-sm leading-6 text-stone-700' : 'mt-8 rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-stone-900/10'}>Đã nhận. Tơ Hồng sẽ trả lời qua cách liên hệ bạn để lại.</p>
      ) : (
        <form
          className={embedded ? 'space-y-3' : 'mt-8 space-y-3'}
          onSubmit={(event) => {
            event.preventDefault()
            setPending(true)
            setError('')
            void fetch('/api/ho-tro', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, contact, message }),
            })
              .then(async (res) => {
                const data = (await res.json()) as { error?: string }
                if (!res.ok) throw new Error(data.error ?? 'Không gửi được')
                setDone(true)
              })
              .catch((cause) => setError(cause instanceof Error ? cause.message : 'Không gửi được'))
              .finally(() => setPending(false))
          }}
        >
          <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên của bạn" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />
          <input required value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Số điện thoại hoặc email" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />
          <textarea required minLength={8} value={message} onChange={(event) => setMessage(event.target.value)} rows={5} placeholder="Link thiệp và việc đang kẹt" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[#4a1520] px-5 text-sm text-[#f8f1e7] disabled:opacity-60">
            {pending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </button>
        </form>
      )}
    </div>
  )
}
