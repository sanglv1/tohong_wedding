import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminConsole } from '@/components/studio/admin-console'
import { AdminDesk } from '@/components/studio/admin-desk'
import { PlatformError } from '@/lib/platform/errors'
import { getSessionUser } from '@/lib/platform/session'
import { ensureSeedAdmin, listUsersForAdmin, storageMode } from '@/lib/platform/store'
import type { AdminUserRow, PublicUser } from '@/lib/platform/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cấp tài khoản',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  let user: PublicUser | null = null
  let storageError = ''
  try {
    await ensureSeedAdmin()
    user = await getSessionUser()
  } catch (error) {
    storageError = error instanceof PlatformError ? error.message : 'Không kết nối được nơi lưu tài khoản'
  }

  if (storageError) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="font-invite text-4xl">Chưa mở được trang cấp tài khoản</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{storageError}</p>
      </div>
    )
  }

  if (!user) redirect('/dang-nhap?next=/quan-tri-nen-tang')
  if (user.role !== 'admin') redirect('/studio')

  let users: AdminUserRow[] | null = null
  let listError = ''
  try {
    users = await listUsersForAdmin()
  } catch (error) {
    listError = error instanceof PlatformError ? error.message : 'Không đọc được danh sách tài khoản'
  }
  if (!users) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="font-invite text-4xl">Chưa đọc được danh sách</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{listError}</p>
      </div>
    )
  }
  return (
    <>
      <AdminConsole me={user} initialUsers={users} storage={storageMode()} />
      <AdminDesk storage={storageMode()} />
    </>
  )
}
