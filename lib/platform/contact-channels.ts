export type ContactChannel = {
  id: 'zalo' | 'phone' | 'email' | 'facebook'
  label: string
  value: string
  href: string
}

function digits(value: string | undefined) {
  return (value ?? '').replace(/[^\d]/g, '')
}

function spacedPhone(raw: string) {
  if (raw.length === 10) return `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7)}`
  return raw
}

function telHref(raw: string) {
  if (raw.startsWith('0')) return `tel:+84${raw.slice(1)}`
  return `tel:+${raw}`
}

export function contactChannels(): ContactChannel[] {
  const channels: ContactChannel[] = []
  const zalo = digits(process.env.CONTACT_ZALO)
  const phone = digits(process.env.CONTACT_PHONE)
  const email = process.env.CONTACT_EMAIL?.trim() ?? ''
  const facebook = process.env.CONTACT_FACEBOOK?.trim() ?? ''
  if (zalo) channels.push({ id: 'zalo', label: 'Zalo tư vấn', value: spacedPhone(zalo), href: `https://zalo.me/${zalo}` })
  if (phone) channels.push({ id: 'phone', label: 'Điện thoại', value: spacedPhone(phone), href: telHref(phone) })
  if (email) channels.push({ id: 'email', label: 'Email', value: email, href: `mailto:${email}` })
  if (facebook) {
    const href = /^https?:\/\//i.test(facebook) ? facebook : `https://${facebook}`
    channels.push({ id: 'facebook', label: 'Facebook', value: facebook.replace(/^https?:\/\//, ''), href })
  }
  return channels
}
