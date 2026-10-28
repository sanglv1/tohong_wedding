'use client'

/* Ảnh do người dùng tải lên hoặc dán link ngoài, không cố định một domain */
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'

const PHOTO_EDGE = 1600

async function preparePhoto(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Không xử lý được ảnh')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob) throw new Error('Không xử lý được ảnh')
  const name = file.name.replace(/\.[^.]+$/, '') || 'anh'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
}

function accepted(file: File) {
  const typeOk = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const extOk = ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp'
  if (typeOk || extOk) return true
  if (file.type === 'image/heic' || ext === 'heic' || ext === 'heif') {
    throw new Error('Ảnh HEIC của iPhone chưa đọc được. Hãy xuất ra JPG rồi tải lại.')
  }
  throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WEBP')
}

export async function uploadAudio(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!['mp3', 'm4a', 'mp4'].includes(ext) && !file.type.startsWith('audio/')) {
    throw new Error('Chỉ nhận nhạc MP3 hoặc M4A')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('kind', 'audio')
  const res = await fetch('/api/studio/media', { method: 'POST', body: form })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Không tải được nhạc')
  return data.url
}

export async function uploadImage(file: File, kind: 'photo' | 'qr') {
  accepted(file)
  let body = file
  if (kind === 'photo') {
    try {
      body = await preparePhoto(file)
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Chỉ nhận')) throw error
      throw new Error('Không xử lý được ảnh này. Hãy chọn JPG, PNG hoặc WEBP.')
    }
  } else if (file.size > 2 * 1024 * 1024) {
    throw new Error('Mã QR quá 2 MB')
  }
  const form = new FormData()
  form.append('file', body)
  const res = await fetch('/api/studio/media', { method: 'POST', body: form })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Không tải được ảnh')
  return data.url
}

export function ImageField({
  label,
  value,
  onChange,
  kind,
  fit = 'cover',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  kind: 'photo' | 'qr'
  fit?: 'cover' | 'contain'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onPick(list: FileList | null) {
    const file = list?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onChange(await uploadImage(file, kind))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được ảnh')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className={`h-16 w-16 shrink-0 rounded-xl border border-stone-200 bg-white ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-xl border border-dashed border-stone-300 bg-white" />
        )}
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={value}
            placeholder="https://..."
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-400"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {busy ? 'Đang tải…' : kind === 'qr' ? 'Tải mã QR' : 'Tải ảnh lên'}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        hidden
        onChange={(event) => void onPick(event.target.files)}
      />
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  )
}

export function MultiImageButton({
  room,
  onUploaded,
  label = 'Tải nhiều ảnh',
}: {
  room: number
  onUploaded: (urls: string[]) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onPick(list: FileList | null) {
    const files = list ? Array.from(list) : []
    if (!files.length || room <= 0) return
    const batch = files.slice(0, room)
    setBusy(true)
    setError('')
    const urls: string[] = []
    try {
      for (const file of batch) urls.push(await uploadImage(file, 'photo'))
      onUploaded(urls)
      if (files.length > room) setError(`Chỉ thêm được ${room} ảnh nữa. Đã tải ${urls.length} ảnh.`)
    } catch (cause) {
      if (urls.length) onUploaded(urls)
      const message = cause instanceof Error ? cause.message : 'Không tải được ảnh'
      setError(urls.length ? `Đã thêm ${urls.length} ảnh. ${message}` : message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (room <= 0) return null

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? 'Đang tải…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        hidden
        onChange={(event) => void onPick(event.target.files)}
      />
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  )
}
