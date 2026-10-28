'use client'

import { useState, type FormEvent } from 'react'

export function RecoveryForm() {
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Không đổi được mật khẩu')
      setDone(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không đổi được mật khẩu')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <a href="/dang-nhap" className="text-sm text-stone-500">
        ← Đăng nhập
      </a>
      <h1 className="mt-6 font-invite text-4xl">Khôi phục mật khẩu</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Dùng mã khôi phục đã tạo khi còn đăng nhập. Mỗi mã chỉ dùng một lần. Chưa có mã thì nhờ quản trị đặt lại mật khẩu trong trang cấp tài khoản.
      </p>
      {done ? (
        <p className="mt-6 text-sm text-emerald-800">
          Đã đặt mật khẩu mới. <a href="/dang-nhap" className="underline">Đăng nhập</a>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <Field label="Email hoặc tên đăng nhập" value={username} onChange={setUsername} />
          <Field label="Mã khôi phục" value={code} onChange={setCode} />
          <Field label="Mật khẩu mới" value={password} onChange={setPassword} type="password" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-stone-900 px-4 text-sm text-white disabled:opacity-60">
            {pending ? 'Đang lưu…' : 'Đặt mật khẩu mới'}
          </button>
        </form>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5"
      />
    </label>
  )
}
