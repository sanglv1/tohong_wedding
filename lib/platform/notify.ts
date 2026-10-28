import { findUserById } from './store'
import { addNotice } from './ledger'
import type { InvitationRecord } from './types'

export async function notifyRsvp(invite: InvitationRecord, guestName: string) {
  const name = guestName.trim() || 'Một khách'
  try {
    await addNotice({
      userId: invite.ownerId,
      title: 'Có khách xác nhận',
      body: `${name} vừa gửi xác nhận cho thiệp /thiep/${invite.slug}.`,
      href: `/studio/${invite.id}`,
    })
    const user = await findUserById(invite.ownerId)
    const key = process.env.RESEND_API_KEY
    const from = process.env.NOTIFY_FROM
    if (!user?.email || !key || !from) return
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: `Tơ Hồng: ${name} đã xác nhận tham dự`,
        text: `${name} vừa xác nhận tham dự thiệp ${invite.slug}. Mở bàn khách: /studio/${invite.id}`,
      }),
    })
  } catch {
    // Xác nhận đã lưu. Thông báo lỗi không được làm mất phiếu của khách.
  }
}
