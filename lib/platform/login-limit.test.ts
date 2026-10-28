import assert from 'node:assert/strict'
import { test } from 'node:test'
import { judgeLoginAttempts, loginAttemptKey, loginLimitMode } from './login-limit'

test('đăng nhập sai chỉ đếm trên Redis, Redis không trả lời thì từ chối', () => {
  assert.equal(loginLimitMode({ redis: true, production: true, vercel: false }), 'redis')
  assert.equal(loginLimitMode({ redis: false, production: false, vercel: false }), 'open')
  assert.equal(loginLimitMode({ redis: false, production: true, vercel: false }), 'unavailable')
  assert.equal(loginLimitMode({ redis: false, production: false, vercel: true }), 'unavailable')
  assert.equal(judgeLoginAttempts(0), 'allow')
  assert.equal(judgeLoginAttempts(7), 'allow')
  assert.equal(judgeLoginAttempts(8), 'lock')
  assert.equal(judgeLoginAttempts(Number.NaN), 'unavailable')
  assert.equal(loginAttemptKey('1.2.3.4'), 'platform:login:1.2.3.4')
})
