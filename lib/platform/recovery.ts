import { randomBytes } from 'node:crypto'
import { PlatformError } from './errors'
import { hashPassword, verifyPassword } from './password'
import { findUserByEmail, findUserByUsername, setRecoveryHash, setUserPassword } from './store'

const hits = new Map<string, number[]>()

function allow(key: string) {
  const now = Date.now()
  const prev = (hits.get(key) ?? []).filter((time) => now - time < 15 * 60 * 1000)
  if (prev.length >= 8) return false
  prev.push(now)
  hits.set(key, prev)
  return true
}

/** Tạo mã một lần. Mã cũ hết hiệu lực. */
export async function issueRecoveryCode(userId: string) {
  const code = randomBytes(9).toString('base64url')
  await setRecoveryHash(userId, await hashPassword(code))
  return code
}

export async function redeemRecoveryCode(username: string, code: string, password: string) {
  const name = username.trim().toLowerCase()
  if (!allow(`recover:${name}`)) throw new PlatformError('Thử lại sau ít phút', 429)
  const user = name.includes('@') ? await findUserByEmail(name) : await findUserByUsername(name)
  if (!user?.recoveryHash || !(await verifyPassword(code.trim(), user.recoveryHash))) {
    throw new PlatformError('Mã khôi phục không đúng', 401)
  }
  if (password.length < 6) throw new PlatformError('Mật khẩu cần ít nhất 6 ký tự')
  await setUserPassword(user.id, password)
  await setRecoveryHash(user.id, null)
}
