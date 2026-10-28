'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS, money, type PlanId } from '@/lib/platform/commerce'

export function Pricing({
  signedIn,
  invitations,
  selected,
}: {
  signedIn: boolean
  invitations: { id: string; label: string }[]
  selected: string
}) {
  const router = useRouter()
  const [invitationId, setInvitationId] = useState(selected || invitations[0]?.id || '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<PlanId | ''>('')

  async function buy(plan: PlanId) {
    if (!signedIn) {
      router.push(`/dang-nhap?next=${encodeURIComponent(plan === 'mot-thiep' && invitationId ? `/gia?thiep=${invitationId}` : '/gia')}`)
      return
    }
    setPending(plan)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, invitationId: plan === 'mot-thiep' ? invitationId : undefined }),
      })
      const data = (await res.json()) as { error?: string; order?: { id: string } }
      if (!res.ok || !data.order) throw new Error(data.error ?? 'Không tạo được đơn')
      router.push(`/don/${data.order.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được đơn')
      setPending('')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">Giá</p>
      <h1 className="mt-3 font-invite text-5xl">Viết miễn phí. Trả khi xuất bản.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
        Chuyển khoản hoặc thanh toán VNPAY trên trang đơn. Một thiệp là một lần trả. Studio là 30 ngày cho người làm nhiều đám.
      </p>
      {signedIn && (
        <label className="mt-8 block max-w-md text-sm">
          Thiệp muốn xuất bản với gói Một thiệp
          <select value={invitationId} onChange={(event) => setInvitationId(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5">
            {invitations.length === 0 && <option value="">Chưa có thiệp — hãy tạo trong xưởng trước</option>}
            {invitations.map((invite) => (
              <option key={invite.id} value={invite.id}>{invite.label}</option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="flex flex-col rounded-[1.4rem] bg-white p-6 ring-1 ring-stone-900/10">
          <h2 className="font-invite text-4xl">Viết thử</h2>
          <p className="mt-2 font-invite text-3xl text-[#4a1520]">0 đ</p>
          <p className="mt-3 flex-1 text-sm leading-6 text-stone-600">Ba thiệp nháp. Xem trên điện thoại của bạn. Chưa gửi được cho khách.</p>
          <a href={signedIn ? '/studio' : '/dang-ky'} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 px-5 text-sm">
            Bắt đầu viết
          </a>
        </article>
        {PLANS.map((plan) => (
          <article key={plan.id} className="flex flex-col rounded-[1.4rem] bg-white p-6 ring-1 ring-stone-900/10">
            <h2 className="font-invite text-4xl">{plan.name}</h2>
            <p className="mt-2 font-invite text-3xl text-[#4a1520]">{money(plan.price)}</p>
            <p className="mt-3 flex-1 text-sm leading-6 text-stone-600">{plan.text}</p>
            <button
              type="button"
              disabled={Boolean(pending) || (signedIn && plan.id === 'mot-thiep' && !invitationId)}
              onClick={() => void buy(plan.id)}
              className="mt-6 min-h-11 rounded-full bg-[#4a1520] px-5 text-sm text-[#f8f1e7] disabled:opacity-60"
            >
              {pending === plan.id ? 'Đang tạo đơn…' : signedIn ? 'Tạo đơn thanh toán' : 'Đăng nhập để mua'}
            </button>
          </article>
        ))}
      </div>
      <p className="mt-6 max-w-xl text-sm leading-6 text-stone-500">
        Trả một lần, không thuê theo tháng. Thanh toán qua VNPAY hoặc chuyển khoản. Cách hoàn tiền nằm ở <a href="/thanh-toan" className="underline">thanh toán</a> và <a href="/hoan-tien" className="underline">hoàn tiền</a>.
      </p>
    </div>
  )
}
