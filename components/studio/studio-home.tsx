'use client'

import { useEffect, useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { BrandMark } from '@/components/platform/brand-mark'
import { templateById, TEMPLATES, type TemplateId } from '@/lib/platform/templates'
import type { InvitationSummary, PublicUser } from '@/lib/platform/types'

export function StudioHome({
  user,
  invitations,
  suggested,
}: {
  user: PublicUser
  invitations: InvitationSummary[]
  suggested: TemplateId | null
}) {
  const [items, setItems] = useState(invitations)
  const [open, setOpen] = useState(items.length === 0 || Boolean(suggested))
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  async function create(templateId: TemplateId) {
    setError('')
    setPending(templateId)
    try {
      const res = await fetch('/api/studio/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      const data = (await res.json()) as { error?: string; invitation?: { id: string } }
      if (!res.ok || !data.invitation) throw new Error(data.error ?? 'Không tạo được thiệp')
      go(`/studio/${data.invitation.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được thiệp')
      setPending('')
    }
  }

  async function copy(id: string) {
    setError('')
    setPending(id)
    try {
      const res = await fetch(`/api/studio/invitations/${id}/copy`, { method: 'POST' })
      const data = (await res.json()) as { error?: string; invitation?: { id: string } }
      if (!res.ok || !data.invitation) throw new Error(data.error ?? 'Không sao chép được')
      go(`/studio/${data.invitation.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không sao chép được')
      setPending('')
    }
  }

  async function remove(id: string) {
    const item = items.find((invite) => invite.id === id)
    const label = titleOf(item)
    if (!window.confirm(`Xóa «${label}»? Thiệp đã xuất bản sẽ không còn mở được bằng link cũ.`)) return
    setError('')
    setPending(id)
    try {
      const res = await fetch(`/api/studio/invitations/${id}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Không xóa được')
      setItems((current) => current.filter((invite) => invite.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xóa được')
    } finally {
      setPending('')
    }
  }

  async function issueRecovery() {
    setError('')
    setPending('recovery')
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue' }),
      })
      const data = (await res.json()) as { error?: string; code?: string }
      if (!res.ok || !data.code) throw new Error(data.error ?? 'Không tạo được mã')
      setRecoveryCode(data.code)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được mã')
    } finally {
      setPending('')
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    go('/dang-nhap')
  }

  const suggestedName = suggested ? templateById(suggested).name : ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/" className="inline-flex items-center gap-2.5 font-invite text-3xl">
            <BrandMark className="h-8 w-8" />
            Tơ Hồng
          </a>
          <p className="text-sm text-stone-500">
            {user.name} · @{user.username}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === 'admin' && (
            <a href="/quan-tri-nen-tang" className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm">
              Cấp tài khoản
            </a>
          )}
          <button type="button" disabled={pending === 'recovery'} onClick={() => void issueRecovery()} className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm disabled:opacity-60">
            Mã khôi phục
          </button>
          <button type="button" onClick={() => void logout()} className="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-4 text-sm text-white">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-invite text-4xl">Thiệp của tôi</h1>
          <p className="mt-1 text-sm text-stone-500">
            Mỗi thiệp có nội dung và đường dẫn riêng. Viết miễn phí, trả khi xuất bản. <a href="/gia" className="underline">Xem giá</a>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-stone-900 px-4 text-sm text-white"
        >
          <Plus className="h-4 w-4" /> Tạo thiệp mới
        </button>
      </div>

      <NoticeStrip />

      {suggested && (
        <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6">
          <p>Tạo thiệp mới với mẫu {suggestedName}. Thiệp đang có không bị đổi.</p>
          <button
            type="button"
            disabled={pending === suggested}
            onClick={() => void create(suggested)}
            className="mt-2 inline-flex min-h-11 items-center rounded-full bg-stone-900 px-4 text-sm text-white disabled:opacity-60"
          >
            {pending === suggested ? 'Đang tạo…' : `Tạo với mẫu ${suggestedName}`}
          </button>
        </div>
      )}

      {recoveryCode && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Mã khôi phục, chỉ hiện lần này: <span className="font-medium">{recoveryCode}</span>. Hãy chép và cất. Dùng ở trang Quên mật khẩu. Mã cũ không còn dùng được.
        </p>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {open && (
        <section className="mt-4 rounded-[1.5rem] bg-white p-4">
          <h2 className="font-invite text-3xl">Chọn mẫu</h2>
          <p className="mt-1 text-sm text-stone-500">Thiệp mới là bản nháp. Đổi mẫu sau này không mất chữ đã viết.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={Boolean(pending)}
                onClick={() => void create(template.id)}
                className={`rounded-2xl border p-2 text-left disabled:opacity-60 ${template.id === suggested ? 'border-stone-900 ring-2 ring-stone-900' : 'border-stone-200'}`}
              >
                <span className="block h-12 rounded-lg" style={{ background: template.swatch }} />
                <span className="mt-2 block text-sm font-medium">{template.name}</span>
                <span className="block text-xs text-stone-500">{template.mood}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <ul className="mt-6 grid gap-3">
        {user.role === 'admin' && (
          <li className="rounded-[1.5rem] bg-white p-4">
            <h2 className="font-invite text-3xl">Tiến Đạt & Huyền Trang</h2>
            <p className="mt-1 text-sm text-stone-500">Thiệp gốc · khách và xác nhận dùng chung với thiệp đã phát hành</p>
            <p className="mt-1 text-sm text-stone-500">/thiep/tien-dat-huyen-trang</p>
            <a href="/studio/goc" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-stone-900 px-4 text-sm text-white">
              Bàn khách
            </a>
          </li>
        )}
        {items.length === 0 && <li className="rounded-[1.5rem] bg-white px-4 py-6 text-sm text-stone-600">Chưa có thiệp nào. Hãy chọn một mẫu để bắt đầu.</li>}
        {items.map((invite) => {
          const label = titleOf(invite)
          return (
            <li key={invite.id} className="rounded-[1.5rem] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-invite text-3xl">{label}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {templateById(invite.published ? (invite.publishedTemplateId ?? invite.templateId) : invite.templateId).name}
                    {' · '}
                    {invite.published ? 'Đang mở cho khách' : 'Bản nháp'}
                    {invite.published && invite.publishedTemplateId && invite.publishedTemplateId !== invite.templateId
                      ? ` · bản nháp đang đổi sang ${templateById(invite.templateId).name}`
                      : ''}
                  </p>
                  <p className="mt-1 truncate text-sm text-stone-500">/thiep/{invite.slug}</p>
                  {invite.pendingSlug && <p className="mt-1 text-sm text-amber-800">Đường dẫn mới {invite.pendingSlug} sẽ áp dụng khi cập nhật.</p>}
                </div>
                <a href={`/studio/${invite.id}`} className="inline-flex min-h-11 items-center rounded-full bg-stone-900 px-4 text-sm text-white">
                  Sửa
                </a>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {invite.published && (
                  <a href={`/thiep/${invite.slug}`} target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm">
                    Mở thiệp
                  </a>
                )}
                <button
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => void copy(invite.id)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-stone-300 px-4 text-sm disabled:opacity-60"
                >
                  <Copy className="h-4 w-4" /> Sao chép
                </button>
                <button
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => void remove(invite.id)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-red-700 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> Xóa
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NoticeStrip() {
  const [items, setItems] = useState<{ id: string; title: string; body: string; href: string }[]>([])
  useEffect(() => {
    void fetch('/api/notices', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: { notices?: { id: string; title: string; body: string; href: string }[] }) => {
        if (Array.isArray(data.notices)) setItems(data.notices.slice(0, 3))
      })
      .catch(() => undefined)
  }, [])
  if (items.length === 0) return null
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
          <a href={item.href} className="font-medium underline">{item.title}</a>
          <p className="mt-1 text-stone-600">{item.body}</p>
        </li>
      ))}
    </ul>
  )
}

function go(href: string) {
  window.location.assign(href)
}

function titleOf(invite: InvitationSummary | undefined) {
  if (!invite) return 'Thiệp này'
  const groom = invite.groom.trim()
  const bride = invite.bride.trim()
  if (groom && bride) return `${groom} & ${bride}`
  return 'Thiệp chưa đặt tên'
}
