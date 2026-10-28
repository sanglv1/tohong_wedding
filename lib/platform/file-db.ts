import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { PlatformError } from './errors'
import { parseInvite } from './records'
import type { InvitationRecord, PlatformUser } from './types'

type FileDB = { users: PlatformUser[]; invitations: InvitationRecord[] }
export type WriteCode = 'ok' | 'missing' | 'conflict' | 'slug' | 'forbidden'

const queues = new Map<string, Promise<void>>()

function locked<T>(file: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(file) ?? Promise.resolve()
  const run = previous.then(task, task)
  const settled = run.then(
    () => undefined,
    () => undefined,
  )
  queues.set(file, settled)
  return run
}

function parseUser(raw: unknown): PlatformUser | null {
  if (!raw || typeof raw !== 'object') return null
  const user = raw as PlatformUser
  if (typeof user.id !== 'string' || typeof user.username !== 'string' || typeof user.passwordHash !== 'string') return null
  if (user.role !== 'admin' && user.role !== 'member') return null
  return user
}

async function readDb(file: string): Promise<FileDB> {
  try {
    const raw = await readFile(file, 'utf8')
    const data = JSON.parse(raw) as FileDB
    if (!data || !Array.isArray(data.users) || !Array.isArray(data.invitations)) {
      throw new PlatformError('Tệp dữ liệu nền tảng bị hỏng', 500)
    }
    return {
      users: data.users.map(parseUser).filter((user): user is PlatformUser => user !== null),
      invitations: data.invitations.map(parseInvite).filter((invite): invite is InvitationRecord => invite !== null),
    }
  } catch (error) {
    if (error instanceof PlatformError) throw error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { users: [], invitations: [] }
    throw error
  }
}

async function writeDb(file: string, db: FileDB) {
  try {
    await mkdir(dirname(file), { recursive: true })
    const body = `${JSON.stringify(db, null, 2)}\n`
    await writeFile(file, body, 'utf8')
    const written = await readFile(file, 'utf8')
    if (written !== body) throw new PlatformError('Không xác nhận được dữ liệu vừa lưu', 502)
  } catch (error) {
    if (error instanceof PlatformError) throw error
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'EROFS' || code === 'EPERM' || code === 'EACCES') {
      throw new PlatformError('Máy chủ không ghi được file. Hãy gắn Upstash Redis để lưu tài khoản và thiệp.', 503)
    }
    throw error
  }
}

export function createFileDb(file: string) {
  function run<T>(task: (db: FileDB) => Promise<T>) {
    return locked(file, async () => {
      const db = await readDb(file)
      return task(db)
    })
  }

  return {
    listUsers: () => run(async (db) => db.users),
    getUser: (id: string) => run(async (db) => db.users.find((user) => user.id === id) ?? null),
    getUserByUsername: (username: string) => run(async (db) => db.users.find((user) => user.username === username) ?? null),
    getUserByEmail: (email: string) => run(async (db) => db.users.find((user) => user.email === email) ?? null),
    getUserByFacebookId: (facebookId: string) => run(async (db) => db.users.find((user) => user.facebookId === facebookId) ?? null),
    insertUser(user: PlatformUser) {
      return run(async (db) => {
        if (db.users.some((item) => item.username === user.username)) return 'taken' as const
        if (user.email && db.users.some((item) => item.email === user.email)) return 'email' as const
        if (user.facebookId && db.users.some((item) => item.facebookId === user.facebookId)) return 'facebook' as const
        db.users.push(user)
        await writeDb(file, db)
        return 'ok' as const
      })
    },
    putUser(user: PlatformUser) {
      return run(async (db) => {
        const index = db.users.findIndex((item) => item.id === user.id)
        if (index < 0) throw new PlatformError('Không thấy tài khoản', 404)
        if (user.email && db.users.some((item) => item.id !== user.id && item.email === user.email)) {
          throw new PlatformError('Email này đã có tài khoản. Hãy đăng nhập.')
        }
        if (user.facebookId && db.users.some((item) => item.id !== user.id && item.facebookId === user.facebookId)) {
          throw new PlatformError('Tài khoản Facebook này đã được nối')
        }
        db.users[index] = user
        await writeDb(file, db)
      })
    },
    deleteUser(id: string) {
      return run(async (db) => {
        db.users = db.users.filter((item) => item.id !== id)
        await writeDb(file, db)
      })
    },
    getInviteBySlug: (slug: string) => run(async (db) => db.invitations.find((item) => item.slug === slug) ?? null),
    getInviteById: (id: string) => run(async (db) => db.invitations.find((item) => item.id === id) ?? null),
    listInvitesByOwner: (ownerId: string) => run(async (db) => db.invitations.filter((item) => item.ownerId === ownerId)),
    insertInvite(invite: InvitationRecord) {
      return run(async (db) => {
        if (db.invitations.some((item) => item.slug === invite.slug || item.id === invite.id)) return 'slug' as const
        db.invitations.push(invite)
        await writeDb(file, db)
        return 'ok' as const
      })
    },
    replaceInvite(previousSlug: string, next: InvitationRecord, expectedRevision: number) {
      return run(async (db) => {
        const current = db.invitations.find((item) => item.id === next.id)
        if (!current) return 'missing' as const
        if (current.ownerId !== next.ownerId) return 'forbidden' as const
        if (current.revision !== expectedRevision) return 'conflict' as const
        if (current.slug !== previousSlug) return 'conflict' as const
        if (next.slug !== current.slug && db.invitations.some((item) => item.slug === next.slug)) return 'slug' as const
        db.invitations = db.invitations.filter((item) => item.id !== next.id)
        db.invitations.push(next)
        await writeDb(file, db)
        return 'ok' as const
      })
    },
    replaceAll(users: PlatformUser[], invitations: InvitationRecord[]) {
      return run(async () => {
        await writeDb(file, { users, invitations })
      })
    },
    removeInvite(ownerId: string, id: string) {
      return run(async (db) => {
        const current = db.invitations.find((item) => item.id === id)
        if (!current) return 'missing' as const
        if (current.ownerId !== ownerId) return 'forbidden' as const
        db.invitations = db.invitations.filter((item) => item.id !== id)
        await writeDb(file, db)
        return 'ok' as const
      })
    },
  }
}
