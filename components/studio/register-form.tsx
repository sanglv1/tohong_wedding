'use client'

import { useState, type FormEvent } from 'react'
import { BrandMark } from '@/components/platform/brand-mark'
import { AuthDivider, FacebookContinue } from '@/components/studio/facebook-continue'

export function RegisterForm({ notice = '' }: { notice?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Không tạo được tài khoản')
      window.location.assign('/studio')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được tài khoản')
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-16">
      <a href="/" className="inline-flex items-center gap-2.5 font-invite text-3xl">
        <BrandMark className="h-8 w-8" />
        Tơ Hồng
      </a>
      <h1 className="mt-8 font-invite text-4xl">Tạo tài khoản</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Dùng email và mật khẩu, hoặc Facebook. Viết và xem thử thiệp không mất phí.
      </p>
      {notice && <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{notice}</p>}
      <form onSubmit={onSubmit} className="mt-8 grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">Tên của bạn</span>
          <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-400" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">Email</span>
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-400" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">Mật khẩu</span>
          <input required type="password" minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-400" />
        </label>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={pending} className="mt-2 min-h-11 rounded-full bg-[#4a1520] px-5 text-sm text-[#f8f1e7] disabled:opacity-60">
          {pending ? 'Đang tạo…' : 'Tạo tài khoản'}
        </button>
      </form>
      <AuthDivider />
      <div className="mt-6">
        <FacebookContinue from="dang-ky" />
      </div>
      <p className="mt-4 text-sm text-stone-500">
        Tạo tài khoản là bạn đồng ý <a className="underline" href="/dieu-khoan">điều khoản</a> và <a className="underline" href="/quyen-rieng-tu">quyền riêng tư</a>.
      </p>
      <a href="/dang-nhap" className="mt-3 text-sm text-stone-500 underline">Đã có tài khoản</a>
      <a href="/gia" className="mt-2 text-sm text-stone-500 underline">Xem giá</a>
    </div>
  )
}
