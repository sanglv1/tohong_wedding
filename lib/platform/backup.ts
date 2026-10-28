import type { GuestRecord } from '@/lib/guests'
import type { RsvpEntry } from '@/lib/rsvp'
import { guestList, replaceEngagement, rsvpList, wishList } from './engagement'
import { PlatformError } from './errors'
import { parseInvite } from './records'
import { installSnapshot, snapshotPlatform } from './store'
import type { InvitationRecord, PlatformUser } from './types'

type Wish = { id: string; name: string; message: string; createdAt: string }

export type BackupFile = {
  version: 1
  exportedAt: string
  users: PlatformUser[]
  invitations: InvitationRecord[]
  engagement: Record<string, { rsvps: RsvpEntry[]; wishes: Wish[]; guests: GuestRecord[] }>
}

export async function buildBackup(): Promise<BackupFile> {
  const { users, invitations } = await snapshotPlatform()
  const engagement: BackupFile['engagement'] = {}
  for (const invite of invitations) {
    const [rsvps, wishes, guests] = await Promise.all([rsvpList(invite.id), wishList(invite.id), guestList(invite.id)])
    engagement[invite.id] = { rsvps, wishes, guests }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    users,
    invitations: invitations.map((invite) => invite),
    engagement,
  }
}

export async function restoreBackup(raw: unknown) {
  const data = parseBackup(raw)
  await installSnapshot(data.users, data.invitations)
  for (const invite of data.invitations) {
    const bag = data.engagement[invite.id]
    if (!bag) continue
    await replaceEngagement(invite.id, bag)
  }
}

function parseBackup(raw: unknown): BackupFile {
  if (!raw || typeof raw !== 'object') throw new PlatformError('File sao lưu không đọc được', 400)
  const data = raw as Partial<BackupFile>
  if (data.version !== 1 || !Array.isArray(data.users) || !Array.isArray(data.invitations)) {
    throw new PlatformError('File sao lưu không đúng định dạng', 400)
  }
  const users = data.users.filter(isUser)
  if (!users.some((user) => user.role === 'admin')) throw new PlatformError('Bản sao lưu cần ít nhất một tài khoản quản trị', 400)
  const invitations = data.invitations.map((item) => parseInvite(item)).filter((item) => item !== null)
  if (invitations.length !== data.invitations.length) throw new PlatformError('Một thiệp trong bản sao lưu bị hỏng', 400)
  const engagement: BackupFile['engagement'] = {}
  const source = data.engagement && typeof data.engagement === 'object' ? data.engagement : {}
  for (const invite of invitations) {
    const bag = (source as Record<string, { rsvps?: RsvpEntry[]; wishes?: Wish[]; guests?: GuestRecord[] }>)[invite.id]
    engagement[invite.id] = {
      rsvps: Array.isArray(bag?.rsvps) ? bag.rsvps : [],
      wishes: Array.isArray(bag?.wishes) ? bag.wishes : [],
      guests: Array.isArray(bag?.guests) ? bag.guests : [],
    }
  }
  return { version: 1, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '', users, invitations, engagement }
}

function isUser(value: unknown): value is PlatformUser {
  if (!value || typeof value !== 'object') return false
  const user = value as PlatformUser
  return typeof user.id === 'string' && typeof user.username === 'string' && typeof user.passwordHash === 'string' && (user.role === 'admin' || user.role === 'member')
}
