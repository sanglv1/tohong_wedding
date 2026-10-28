import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { WeddingContent } from '@/lib/content'
import { PlatformError } from './errors'
import { createFileDb } from './file-db'
import { sniffImage } from './image-type'
import { collectMediaIds } from './media-ids'
import { planCopy, planInvitationWrite, publicContent } from './save-plan'
import { normalizeEmail, usernameSeed } from './identity'
import { openingDress } from './opening-dress'
import { normalizeSlug, slugError } from './slug'
import { storageKind } from './storage-mode'
import { TEMPLATES } from './templates'
import type { InvitationRecord, PlatformUser } from './types'

function content(groom: string): WeddingContent {
  return {
    couple: { groom, bride: 'Be', groomShort: groom, brideShort: 'Be', groomBrand: groom, brideBrand: 'Be' },
  } as WeddingContent
}

function invite(patch: Partial<InvitationRecord> = {}): InvitationRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    ownerId: 'owner-1',
    slug: 'an-be',
    templateId: 'nga-sang',
    published: false,
    content: content('An'),
    updatedAt: '2026-01-01T00:00:00.000Z',
    revision: 1,
    ...patch,
  }
}

test('production không ghi file khi thiếu Redis', () => {
  assert.equal(storageKind({ redis: true, production: true, vercel: true }), 'redis')
  assert.equal(storageKind({ redis: false, production: false, vercel: false }), 'file')
  assert.throws(() => storageKind({ redis: false, production: true, vercel: false }), (error: unknown) => {
    return error instanceof PlatformError && error.status === 503
  })
  assert.throws(() => storageKind({ redis: false, production: false, vercel: true }), PlatformError)
})

test('slug giữ đường dẫn hệ thống', () => {
  assert.equal(normalizeSlug('Huyền Trang'), 'huyen-trang')
  assert.equal(slugError('admin'), 'Đường dẫn này được giữ cho hệ thống')
  assert.equal(slugError('an-be'), null)
})

test('lưu nháp không xuất bản và không đè bản khách đang xem', () => {
  const published = invite({
    published: true,
    revision: 4,
    content: content('An'),
    templateId: 'do-son',
  })
  const next = planInvitationWrite(
    published,
    { mode: 'draft', slug: 'ten-moi', templateId: 'hong-dao', content: content('Bình') },
    '2026-02-01T00:00:00.000Z',
  )
  assert.equal(published.published, true)
  assert.equal(published.slug, 'an-be')
  assert.equal(published.revision, 4)
  assert.equal(next.published, true)
  assert.equal(next.slug, 'an-be')
  assert.equal(next.pendingSlug, 'ten-moi')
  assert.equal(next.templateId, 'hong-dao')
  assert.equal(next.revision, 5)
  assert.equal(publicContent(next).couple.groom, 'An')
  assert.equal(next.content.couple.groom, 'Bình')
  assert.equal(next.publishedTemplateId, 'do-son')

  const again = planInvitationWrite(
    next,
    { mode: 'draft', slug: 'ten-moi', templateId: 'hong-dao', content: content('Chi') },
    '2026-02-02T00:00:00.000Z',
  )
  assert.equal(publicContent(again).couple.groom, 'An')
  assert.equal(again.content.couple.groom, 'Chi')
})

test('xuất bản mới đổi bản công khai và đường dẫn', () => {
  const draft = invite({ published: true, pendingSlug: 'ten-moi', publishedContent: content('An'), revision: 2 })
  const next = planInvitationWrite(
    draft,
    { mode: 'publish', slug: 'ten-moi', templateId: 'sen-trang', content: content('Đạt') },
    '2026-03-01T00:00:00.000Z',
  )
  assert.equal(next.published, true)
  assert.equal(next.slug, 'ten-moi')
  assert.equal(next.pendingSlug, undefined)
  assert.equal(next.templateId, 'sen-trang')
  assert.equal(publicContent(next).couple.groom, 'Đạt')
  assert.equal(next.publishedTemplateId, 'sen-trang')
})

test('sao chép tạo bản nháp mới và không sửa gốc', () => {
  const source = invite({ published: true, publishedContent: content('An'), revision: 3 })
  const copy = planCopy(source, '22222222-2222-4222-8222-222222222222', 'an-be-ban-sao', '2026-04-01T00:00:00.000Z')
  assert.equal(source.published, true)
  assert.equal(source.revision, 3)
  assert.equal(copy.published, false)
  assert.equal(copy.revision, 1)
  assert.equal(copy.publishedContent, undefined)
  assert.equal(copy.content.couple.groom, 'An')
  assert.notEqual(copy.content, source.content)
})

test('ảnh tải lên được nhận diện, link ngoài bị bỏ qua', () => {
  assert.equal(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg')
  assert.equal(sniffImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])), 'image/png')
  assert.equal(sniffImage(Uint8Array.from([1, 2, 3, 4])), null)
  assert.deepEqual(
    collectMediaIds({
      hero: { src: '/api/media/abcdefghij123456' },
      gallery: [{ src: 'https://example.com/a.jpg' }, { src: '/api/media/abcdefghij123456' }],
      gift: { groom: { qrPath: '/api/media/zzzzzzzzzzzzzzzz' } },
    }),
    ['abcdefghij123456', 'zzzzzzzzzzzzzzzz'],
  )
})

test('một tài khoản giữ nhiều thiệp, lưu cũ không đè bản mới', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wedding-platform-'))
  const db = createFileDb(join(dir, 'platform.json'))
  try {
  await runFileCase(db)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

async function runFileCase(db: ReturnType<typeof createFileDb>) {
  const first = invite()
  const second = invite({
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'khac',
    content: content('Khác'),
  })
  assert.equal(await db.insertInvite(first), 'ok')
  assert.equal(await db.insertInvite(second), 'ok')
  assert.equal((await db.listInvitesByOwner('owner-1')).length, 2)

  const saved = planInvitationWrite(first, { mode: 'draft', slug: 'an-be', templateId: 'muc-tau', content: content('Mới') }, '2026-05-01T00:00:00.000Z')
  assert.equal(await db.replaceInvite(first.slug, saved, first.revision), 'ok')
  assert.equal(await db.replaceInvite(first.slug, saved, first.revision), 'conflict')
  const listed = await db.listInvitesByOwner('owner-1')
  assert.equal(listed.length, 2)
  assert.equal(listed.find((item) => item.id === second.id)?.content.couple.groom, 'Khác')
  assert.equal(listed.find((item) => item.id === first.id)?.content.couple.groom, 'Mới')
  assert.equal(listed.find((item) => item.id === first.id)?.revision, 2)
  assert.equal(await db.insertInvite(invite({ id: '44444444-4444-4444-8444-444444444444', slug: 'an-be' })), 'slug')
  assert.equal(await db.removeInvite('owner-2', first.id), 'forbidden')
  assert.equal(await db.removeInvite('owner-1', first.id), 'ok')
  assert.equal(await db.removeInvite('owner-2', second.id), 'forbidden')
  assert.equal((await db.listInvitesByOwner('owner-1')).map((item) => item.id).join(','), second.id)
}

test('mỗi mẫu có màu mở và nhịp riêng', () => {
  for (const template of TEMPLATES) {
    const dress = openingDress(template.id)
    assert.match(dress.seal, /^#[0-9a-f]{6}$/)
    assert.match(dress.petal, /^#[0-9a-f]{6}$/)
    assert.ok(dress.pace === 'cham' || dress.pace === 'vua' || dress.pace === 'nhanh')
  }
  assert.notEqual(openingDress('song-hy').seal, openingDress('gam-do').seal)
  assert.notEqual(openingDress('dat-nung').seal, openingDress('thu-tay').seal)
  assert.notEqual(openingDress('bien-cat').petal, openingDress('song-biec').petal)
  assert.notEqual(openingDress('dem-vang').pace, openingDress('tre-truc').pace)
  assert.notEqual(openingDress('sang-trang').flash, openingDress('giay-do').flash)
})

test('mười mẫu mới khác bố cục và có nhạc mp3 riêng', () => {
  const fresh = ['muc-tau', 'dem-sao', 'san-khau', 'gach-bong', 'cung-dinh', 'song-nhe', 'den-long', 'bao-xuan', 'so-tay', 'kinh-manh']
  const layouts = new Set<string>()
  const tracks = new Set<string>()
  for (const id of fresh) {
    const template = TEMPLATES.find((item) => item.id === id)
    assert.ok(template)
    assert.equal(layouts.has(template.layout), false)
    assert.equal(tracks.has(template.track), false)
    assert.match(template.track, /^\/music\/[a-z]+\.mp3$/)
    layouts.add(template.layout)
    tracks.add(template.track)
    assert.equal(openingDress(id).seal.startsWith('#'), true)
  }
  assert.equal(layouts.size, 10)
  assert.equal(tracks.size, 10)
})

test('email thành tên đăng nhập nội bộ', () => {
  assert.equal(normalizeEmail('  Ban@Email.COM '), 'ban@email.com')
  assert.equal(normalizeEmail('khong-phai-email'), '')
  assert.equal(usernameSeed('ban.cuoi'), 'ban.cuoi')
  assert.equal(usernameSeed('ab'), 'khachab')
})

test('một email và một Facebook chỉ gắn một tài khoản', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wd-user-'))
  try {
    const db = createFileDb(join(dir, 'platform.json'))
    const user = (patch: Partial<PlatformUser>): PlatformUser => ({
      id: '11111111-1111-4111-8111-111111111111',
      username: 'ban',
      passwordHash: 'scrypt$aa$bb',
      name: 'Bạn',
      role: 'member',
      createdAt: '2026-01-01T00:00:00.000Z',
      ...patch,
    })
    assert.equal(await db.insertUser(user({ email: 'ban@email.com', facebookId: '100' })), 'ok')
    assert.equal(await db.insertUser(user({ id: '22222222-2222-4222-8222-222222222222', username: 'khac', email: 'ban@email.com' })), 'email')
    assert.equal(await db.insertUser(user({ id: '33333333-3333-4333-8333-333333333333', username: 'nua', facebookId: '100' })), 'facebook')
    assert.equal((await db.getUserByEmail('ban@email.com'))?.username, 'ban')
    assert.equal((await db.getUserByFacebookId('100'))?.username, 'ban')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
