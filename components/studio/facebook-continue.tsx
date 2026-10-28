export function FacebookContinue({ nextPath = '', from }: { nextPath?: string; from: 'dang-nhap' | 'dang-ky' }) {
  const params = new URLSearchParams({ from })
  if (nextPath) params.set('next', nextPath)
  return (
    <a
      href={`/api/auth/facebook?${params.toString()}`}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full bg-[#1877F2] px-4 text-sm font-medium text-white"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
        <path d="M15.1 8.5h-2V6.8c0-.5.3-.6.6-.6H15V4h-2.1C10.6 4 10 5.4 10 6.7v1.8H8.2V11H10v8h3.1v-8h2.1l.3-2.5h-2.4Z" />
      </svg>
      Tiếp tục với Facebook
    </a>
  )
}

export function AuthDivider() {
  return (
    <p className="mt-6 flex items-center gap-3 text-xs tracking-wide text-stone-400 uppercase">
      <span className="h-px flex-1 bg-stone-200" />
      hoặc
      <span className="h-px flex-1 bg-stone-200" />
    </p>
  )
}
