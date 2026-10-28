'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { templateById } from '@/lib/platform/templates'
import type { AdminUserRow, PublicUser } from '@/lib/platform/types'

export function AdminConsole({
  me,
  initialUsers,
  storage,
}: {
  me: PublicUser
  initialUsers: AdminUserRow[]
  storage: 'redis' | 'file'
}) {
  const [users, setUsers] = useState(initialUsers)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function createUser(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setPending(true)
    try {
      const res = await fetch('/api/platform/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name }),
      })
      const data = (await res.json()) as { error?: string; users?: AdminUserRow[] }
      if (!res.ok || !data.users) throw new Error(data.error ?? 'Không tạo được')
      setUsers(data.users)
      const createdName = username.trim().toLowerCase()
      const createdPassword = password
      setUsername('')
      setPassword('')
      setName('')
      setMessage(`Đã tạo tài khoản ${createdName}. Mật khẩu: ${createdPassword}. Hãy gửi cho họ. Họ đăng nhập rồi tự tạo thiệp.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được')
    } finally {
      setPending(false)
    }
  }

  async function resetPassword(id: string, nextPassword: string) {
    setError('')
    setMessage('')
    const res = await fetch(`/api/platform/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: nextPassword }),
    })
    const data = (await res.json()) as { error?: string; users?: AdminUserRow[] }
    if (!res.ok || !data.users) {
      setError(data.error ?? 'Không đổi được mật khẩu')
      return
    }
    setUsers(data.users)
    setMessage('Đã đặt lại mật khẩu.')
  }

  async function remove(id: string) {
    if (!window.confirm('Xóa tài khoản này và mọi thiệp của họ?')) return
    setError('')
    const res = await fetch(`/api/platform/users/${id}`, { method: 'DELETE' })
    const data = (await res.json()) as { error?: string; users?: AdminUserRow[] }
    if (!res.ok || !data.users) {
      setError(data.error ?? 'Không xóa được')
      return
    }
    setUsers(data.users)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- xóa cookie phiên rồi tải lại trang khách
    window.location.assign('/dang-nhap')
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href="/tao-thiep" className="font-invite text-3xl">
            Thiệp
          </a>
          <p className="text-sm text-stone-500">Cấp tài khoản · {me.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio" className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm">
            Thiệp của tôi
          </Link>
          <button type="button" onClick={() => void logout()} className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white">
            Đăng xuất
          </button>
        </div>
      </header>

      <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-stone-600">
        {storage === 'redis'
          ? 'Tài khoản và thiệp đang lưu trên Redis. Bản deploy dùng được.'
          : 'Đang lưu trên file của máy này. Bản deploy bắt buộc gắn Upstash Redis (KV_REST_API_URL và KV_REST_API_TOKEN), không ghi ra ổ đĩa tạm.'}
      </p>
      <BackupBox onMessage={setMessage} onError={setError} />

      <form onSubmit={createUser} className="mt-6 grid gap-3 rounded-[1.5rem] bg-white p-5">
        <h2 className="font-invite text-3xl">Tài khoản mới</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Tên hiển thị" value={name} onChange={setName} />
          <Input label="Tên đăng nhập" value={username} onChange={setUsername} />
          <Input label="Mật khẩu" value={password} onChange={setPassword} type="text" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-emerald-800">{message}</p>}
        <button type="submit" disabled={pending} className="justify-self-start rounded-full bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-60">
          {pending ? 'Đang tạo…' : 'Cấp tài khoản'}
        </button>
      </form>

      <ul className="mt-6 grid gap-3">
        {users.map((user) => (
          <li key={user.id} className="rounded-[1.5rem] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {user.name} <span className="text-stone-400">@{user.username}</span>
                </p>
                <p className="mt-1 text-xs tracking-wide text-stone-400 uppercase">{user.role === 'admin' ? 'Quản trị' : 'Thành viên'}</p>
                {user.invitations.length > 0 ? (
                  <ul className="mt-2 grid gap-1">
                    {user.invitations.map((invite) => (
                      <li key={invite.slug} className="text-sm">
                        {invite.published ? (
                          <a href={`/thiep/${invite.slug}`} target="_blank" className="underline decoration-stone-300 underline-offset-4">
                            /thiep/{invite.slug}
                          </a>
                        ) : (
                          <span>/thiep/{invite.slug} · chưa xuất bản</span>
                        )}
                        <span className="text-stone-400"> · {templateById(invite.templateId).name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-stone-400">Chưa có thiệp</p>
                )}
              </div>
              {user.id !== me.id && user.role !== 'admin' && (
                <button type="button" onClick={() => void remove(user.id)} className="text-sm text-red-700">
                  Xóa
                </button>
              )}
            </div>
            <PasswordReset onSave={(next) => resetPassword(user.id, next)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function PasswordReset({ onSave }: { onSave: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setPending(true)
        void onSave(password).finally(() => {
          setPassword('')
          setPending(false)
        })
      }}
    >
      <label className="block">
        <span className="mb-1 block text-xs text-stone-500">Mật khẩu mới</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm"
        />
      </label>
      <button type="submit" disabled={pending || password.length < 6} className="rounded-full border border-stone-300 px-3 py-2 text-sm disabled:opacity-50">
        Đặt lại
      </button>
    </form>
  )
}

function BackupBox({ onMessage, onError }: { onMessage: (value: string) => void; onError: (value: string) => void }) {
  const [pending, setPending] = useState(false)

  async function download() {
    onError('')
    onMessage('')
    setPending(true)
    try {
      const res = await fetch('/api/platform/backup')
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Không tải được')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'webding-sao-luu.json'
      link.click()
      URL.revokeObjectURL(url)
      onMessage('Đã tải bản sao lưu. File này chứa mật khẩu đã băm. Hãy cất kín.')
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Không tải được')
    } finally {
      setPending(false)
    }
  }

  async function restore(file: File | undefined) {
    if (!file) return
    if (!window.confirm('Khôi phục sẽ ghi đè tài khoản và thiệp trong file này. Ảnh đã tải lên không nằm trong file.')) return
    onError('')
    onMessage('')
    setPending(true)
    try {
      const body = JSON.parse(await file.text()) as unknown
      const res = await fetch('/api/platform/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Không khôi phục được')
      onMessage('Đã khôi phục. Hãy tải lại trang.')
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Không khôi phục được')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mt-4 rounded-[1.5rem] bg-white p-5">
      <h2 className="font-invite text-3xl">Sao lưu</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Tải file tài khoản, thiệp, xác nhận và lời chúc. Ảnh nằm riêng trong thư mục data/media trên máy, hoặc trên Redis khi đã gắn. Khôi phục ghi đè dữ liệu cùng loại.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => void download()} className="min-h-11 rounded-full bg-stone-900 px-4 text-sm text-white disabled:opacity-60">
          Tải bản sao lưu
        </button>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-stone-300 px-4 text-sm">
          Khôi phục từ file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void restore(file)
            }}
          />
        </label>
      </div>
    </section>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-stone-400"
      />
    </label>
  )
}
