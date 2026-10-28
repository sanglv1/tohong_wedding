'use client'

import { useState, type FormEvent } from 'react'
import { BrandMark } from '@/components/platform/brand-mark'
import { AuthDivider, FacebookContinue } from '@/components/studio/facebook-continue'

type Mode = 'login' | 'setup'

export function LoginForm({
  mode,
  nextPath,
  emptyHint,
  notice = '',
}: {
  mode: Mode
  nextPath: string
  emptyHint: boolean
  notice?: string
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (mode === 'setup' && password !== confirm) {
      setError('Mật khẩu nhập lại chưa khớp')
      return
    }
    setPending(true)
    try {
      const res = await fetch(mode === 'setup' ? '/api/auth/setup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'setup' ? { username, password, name } : { account: username, password }),
      })
      const data = (await res.json()) as { error?: string; role?: string }
      if (!res.ok) throw new Error(data.error ?? 'Không đăng nhập được')
      const destination = data.role === 'admin' && !nextPath.startsWith('/studio') ? '/quan-tri-nen-tang' : nextPath || '/studio'
      // Cookie phiên chỉ được server đọc sau một lần tải trang mới.
      window.location.assign(destination)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không đăng nhập được')
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
      <a href="/" className="inline-flex items-center gap-2.5 font-invite text-3xl">
        <BrandMark className="h-8 w-8" />
        Tơ Hồng
      </a>
      <h1 className="mt-8 font-invite text-4xl">{mode === 'setup' ? 'Tạo tài khoản quản trị' : 'Đăng nhập'}</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        {mode === 'setup'
          ? 'Máy này chưa có tài khoản nào. Tài khoản đầu tiên sẽ là người cấp tài khoản cho mọi người. Chỉ hiện khi chạy trên máy, không có trên bản deploy.'
          : 'Dùng email và mật khẩu. Tài khoản cũ vẫn nhập tên đăng nhập.'}
      </p>
      {emptyHint && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Chưa có tài khoản nào. Trên bản deploy, hãy đặt PLATFORM_ADMIN_USERNAME và PLATFORM_ADMIN_PASSWORD rồi mở lại trang này.
        </p>
      )}
      {notice && <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{notice}</p>}
      <form onSubmit={onSubmit} className="mt-8 grid gap-3">
        {mode === 'setup' && (
          <Field label="Tên của bạn" value={name} onChange={setName} autoComplete="name" />
        )}
        <Field
          label={mode === 'setup' ? 'Tên đăng nhập' : 'Email'}
          value={username}
          onChange={setUsername}
          autoComplete={mode === 'setup' ? 'username' : 'username'}
          inputMode={mode === 'setup' ? undefined : 'email'}
          placeholder={mode === 'setup' ? undefined : 'ban@email.com'}
        />
        <Field label="Mật khẩu" value={password} onChange={setPassword} type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} />
        {mode === 'setup' && (
          <Field label="Nhập lại mật khẩu" value={confirm} onChange={setConfirm} type="password" autoComplete="new-password" />
        )}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={pending} className="mt-2 rounded-full bg-stone-900 px-4 py-3 text-sm text-white disabled:opacity-60">
          {pending ? 'Đang vào…' : mode === 'setup' ? 'Tạo và vào trang quản trị' : 'Vào thiệp của tôi'}
        </button>
      </form>
      {mode === 'login' && (
        <>
          <AuthDivider />
          <div className="mt-6">
            <FacebookContinue nextPath={nextPath} from="dang-nhap" />
          </div>
          <a href="/quen-mat-khau" className="mt-4 text-sm text-stone-500 underline">
            Quên mật khẩu
          </a>
        </>
      )}
      {mode === 'login' && (
        <a href="/dang-ky" className="mt-2 text-sm text-stone-500 underline">
          Tạo tài khoản mới
        </a>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  inputMode?: 'email' | 'text'
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        required
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-400"
      />
    </label>
  )
}
