import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/studio/login-form'
import { facebookNotice } from '@/lib/platform/facebook'
import { PlatformError } from '@/lib/platform/errors'
import { getSessionUser } from '@/lib/platform/session'
import { countUsers, ensureSeedAdmin } from '@/lib/platform/store'
import type { PublicUser } from '@/lib/platform/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
}

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return ''
  return value
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; loi?: string }> }) {
  const params = await searchParams
  const nextPath = safeNext(params.next)
  const notice = facebookNotice(params.loi)
  let storageError = ''
  let total = 0
  let user: PublicUser | null = null
  try {
    await ensureSeedAdmin()
    user = await getSessionUser()
    if (!user) total = await countUsers()
  } catch (error) {
    storageError = error instanceof PlatformError ? error.message : 'Không kết nối được nơi lưu tài khoản'
  }

  if (!storageError && user) {
    const destination = user.role === 'admin' && !nextPath.startsWith('/studio') ? '/quan-tri-nen-tang' : nextPath || '/studio'
    redirect(destination)
  }

  if (storageError) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="font-invite text-4xl">Chưa lưu được tài khoản</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{storageError}</p>
      </div>
    )
  }

  const mode = process.env.NODE_ENV !== 'production' && total === 0 ? 'setup' : 'login'
  const emptyHint = mode === 'login' && total === 0
  return <LoginForm mode={mode} nextPath={nextPath} emptyHint={emptyHint} notice={notice} />
}
