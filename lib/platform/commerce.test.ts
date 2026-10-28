import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canPublishFor, draftLimit, isArchived, KEEP_DAYS, transferCode, type Order } from './commerce'

const DAY = 24 * 60 * 60 * 1000
const now = Date.parse('2026-10-27T00:00:00.000Z')

function order(patch: Partial<Order>): Order {
  return {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    userId: 'user-1',
    plan: 'mot-thiep',
    invitationId: 'thiep-1',
    amount: 299_000,
    code: 'TOHONG AAAAAAAA',
    status: 'da-tra',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...patch,
  }
}

test('mã chuyển khoản lấy 8 ký tự đầu của mã đơn', () => {
  assert.equal(transferCode('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'), 'TOHONG AAAAAAAA')
})

test('xuất bản lần đầu cần đã trả, lần sau thì không', () => {
  const paid = [order({})]
  assert.equal(canPublishFor(paid, 'member', 'user-1', 'thiep-1', false, now), true)
  assert.equal(canPublishFor([], 'member', 'user-1', 'thiep-1', false, now), false)
  assert.equal(canPublishFor([], 'member', 'user-1', 'thiep-1', true, now), true)
  assert.equal(canPublishFor([], 'admin', 'user-1', 'thiep-1', false, now), true)
})

test('studio đang hạn cho xuất bản mọi thiệp', () => {
  const studio = [order({ plan: 'studio', invitationId: null, studioUntil: '2026-11-26T00:00:00.000Z' })]
  assert.equal(canPublishFor(studio, 'member', 'user-1', 'thiep-khac', false, now), true)
  assert.equal(draftLimit(studio, 'user-1', 'member', now), 30)
  assert.equal(draftLimit([], 'user-1', 'member', now), 3)
})

test('chưa thanh toán thì không được xuất bản', () => {
  const pending = order({ status: 'cho' })
  const refunded = order({ status: 'hoan' })
  const otherCard = order({ invitationId: 'thiep-khac' })
  const otherUser = order({ userId: 'user-2' })
  const expiredStudio = order({
    plan: 'studio',
    invitationId: null,
    status: 'da-tra',
    studioUntil: '2026-10-01T00:00:00.000Z',
  })
  assert.equal(canPublishFor([pending], 'member', 'user-1', 'thiep-1', false, now), false)
  assert.equal(canPublishFor([refunded], 'member', 'user-1', 'thiep-1', false, now), false)
  assert.equal(canPublishFor([otherCard], 'member', 'user-1', 'thiep-1', false, now), false)
  assert.equal(canPublishFor([otherUser], 'member', 'user-1', 'thiep-1', false, now), false)
  assert.equal(canPublishFor([expiredStudio], 'member', 'user-1', 'thiep-1', false, now), false)
  assert.equal(canPublishFor([pending], 'member', 'user-1', 'thiep-1', true, now), true)
})

test('thiệp khép 45 ngày sau giờ kết thúc lễ', () => {
  const end = '2026-08-01T00:00:00.000Z'
  assert.equal(isArchived(end, Date.parse(end) + KEEP_DAYS * DAY), false)
  assert.equal(isArchived(end, Date.parse(end) + KEEP_DAYS * DAY + 1), true)
  assert.equal(isArchived(''), false)
})
