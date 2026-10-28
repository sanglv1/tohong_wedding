'use client'

import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import type { WeddingContent } from '@/lib/content'
import { OPENINGS, TRACKS, isOpening, trackBySrc, type OpeningId } from '@/lib/platform/experience'
import { templateById, type TemplateId } from '@/lib/platform/templates'
import { uploadAudio } from '@/components/studio/image-field'

export function DetailFields({
  content,
  templateId,
  onContent,
}: {
  content: WeddingContent
  templateId: TemplateId
  onContent: (edit: (content: WeddingContent) => void) => void
}) {
  const change = (edit: (content: WeddingContent) => void) => onContent(edit)
  const opening: OpeningId = isOpening(content.opening) ? content.opening : templateById(templateId).opening
  const currentTrack = trackBySrc(content.music?.playlist?.[0] ?? '')
  return (
    <>
      <Section title="5. Lễ, tiệc và bản đồ">
        <TextArea label="Lời mời" value={content.announcement} onChange={(value) => change((content) => { content.announcement = value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Ngày âm lịch" value={content.event.lunarDate} placeholder="Tức ngày 11 tháng 11 năm Bính Ngọ" onChange={(value) => change((content) => { content.event.lunarDate = value })} />
          <TextField label="Năm âm lịch" value={content.event.lunarYear} placeholder="Bính Ngọ" onChange={(value) => change((content) => { content.event.lunarYear = value })} />
          <TextField label="Tên lễ" value={content.event.ceremonyName} onChange={(value) => change((content) => { content.event.ceremonyName = value })} />
          <TextField label="Giờ lễ" value={content.event.ceremonyTime} onChange={(value) => change((content) => { content.event.ceremonyTime = value })} />
          <TextField label="Nơi làm lễ" value={content.event.ceremonyVenue} onChange={(value) => change((content) => { content.event.ceremonyVenue = value })} />
          <TextField label="Link bản đồ lễ" value={content.addresses.groomFamily.mapsUrl} placeholder="https://maps.google.com/..." onChange={(value) => change((content) => { content.addresses.groomFamily.mapsUrl = value })} />
          <TextField label="Tên tiệc" value={content.event.mealName} onChange={(value) => change((content) => { content.event.mealName = value })} />
          <TextField label="Giờ tiệc" value={content.event.mealTime} onChange={(value) => change((content) => { content.event.mealTime = value })} />
          <TextField label="Nơi tổ chức tiệc" value={content.event.mealVenue} onChange={(value) => change((content) => { content.event.mealVenue = value })} />
          <TextField label="Địa chỉ nhà gái" value={content.addresses.brideFamily.address} onChange={(value) => change((content) => { content.addresses.brideFamily.address = value })} />
          <TextField label="Link bản đồ nhà gái" value={content.addresses.brideFamily.mapsUrl} placeholder="https://maps.google.com/..." onChange={(value) => change((content) => { content.addresses.brideFamily.mapsUrl = value })} />
          <TextField label="Vĩ độ" value={content.event.venueLat ? String(content.event.venueLat) : ''} placeholder="21.0333" onChange={(value) => change((content) => { content.event.venueLat = numberOrZero(value) })} />
          <TextField label="Kinh độ" value={content.event.venueLng ? String(content.event.venueLng) : ''} placeholder="105.8486" onChange={(value) => change((content) => { content.event.venueLng = numberOrZero(value) })} />
        </div>
        <p className="text-sm text-stone-500">Địa điểm ở phần viết thiệp là địa chỉ nhà trai. Vĩ độ và kinh độ giúp thiệp gắn đúng điểm trên bản đồ.</p>
      </Section>

      <Section title="6. Gia đình">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Tên đầy đủ chú rể" value={content.couple.groom} onChange={(value) => change((content) => { content.couple.groom = value })} />
          <TextField label="Tên đầy đủ cô dâu" value={content.couple.bride} onChange={(value) => change((content) => { content.couple.bride = value })} />
          <TextField label="Ông nhà trai" value={content.family.nhaTrai.ong} onChange={(value) => change((content) => { content.family.nhaTrai.ong = value })} />
          <TextField label="Bà nhà trai" value={content.family.nhaTrai.ba} onChange={(value) => change((content) => { content.family.nhaTrai.ba = value })} />
          <TextField label="Ông nhà gái" value={content.family.nhaGai.ong} onChange={(value) => change((content) => { content.family.nhaGai.ong = value })} />
          <TextField label="Bà nhà gái" value={content.family.nhaGai.ba} onChange={(value) => change((content) => { content.family.nhaGai.ba = value })} />
        </div>
      </Section>

      <Section title="7. Câu chuyện">
        <TextField label="Tiêu đề" value={content.story.title} onChange={(value) => change((content) => { content.story.title = value })} />
        <TextArea label="Lời kể" value={content.story.text} rows={5} onChange={(value) => change((content) => { content.story.text = value })} />
        {(content.story.timeline ?? []).map((item, index) => (
          <div key={`${item.date}-${index}`} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:grid-cols-[8rem_1fr]">
            <TextField label="Mốc" value={item.date} placeholder="2026" onChange={(value) => change((content) => { content.story.timeline[index].date = value })} />
            <TextField label="Sự kiện" value={item.event} placeholder="Lời cầu hôn" onChange={(value) => change((content) => { content.story.timeline[index].event = value })} />
            <button type="button" className="min-h-11 justify-self-start text-sm text-stone-500 underline sm:col-span-2" onClick={() => change((content) => { content.story.timeline.splice(index, 1) })}>
              Xóa mốc này
            </button>
          </div>
        ))}
        <button
          type="button"
          className="min-h-11 justify-self-start rounded-full border border-stone-300 px-4 text-sm"
          onClick={() => change((content) => { content.story.timeline.push({ date: '', event: '' }) })}
        >
          Thêm mốc
        </button>
      </Section>

      <Section title="8. Mở thiệp và nhạc">
        <p className="text-sm text-stone-500">Mỗi mẫu có một cách mở và một bài nhạc. Bạn đổi được cả hai, hoặc tải bài của mình.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPENINGS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={opening === item.id}
              onClick={() => change((next) => { next.opening = item.id })}
              className={`rounded-2xl border px-3 py-2 text-left ${opening === item.id ? 'border-stone-900 bg-white' : 'border-stone-200 bg-stone-50'}`}
            >
              <span className="block text-sm font-medium">{item.name}</span>
              <span className="mt-0.5 block text-xs leading-5 text-stone-500">{item.blurb}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((track) => (
            <button
              key={track.src}
              type="button"
              aria-pressed={currentTrack?.src === track.src && (content.music?.playlist.length ?? 0) === 1}
              onClick={() => change((next) => {
                if (!next.music) next.music = { playlist: [], volume: 0.5 }
                next.music.playlist = [track.src]
              })}
              className={`min-h-11 rounded-full border px-4 text-sm ${currentTrack?.src === track.src && (content.music?.playlist.length ?? 0) === 1 ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300'}`}
            >
              {track.name}
            </button>
          ))}
        </div>
        <MusicUpload
          onUploaded={(url) => change((content) => {
            if (!content.music) content.music = { playlist: [], volume: 0.5 }
            if (!content.music.playlist.includes(url)) content.music.playlist.push(url)
          })}
        />
        <TextArea
          label="Danh sách, mỗi dòng một file hoặc URL"
          value={(content.music?.playlist ?? []).join('\n')}
          placeholder="/music/bai.mp3"
          onChange={(value) => change((content) => {
            if (!content.music) content.music = { playlist: [], volume: 0.5 }
            content.music.playlist = value.split('\n').map((line) => line.trim()).filter(Boolean)
          })}
        />
      </Section>
    </>
  )
}

function MusicUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-stone-300 px-4 text-sm disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? 'Đang tải…' : 'Tải nhạc MP3 hoặc M4A'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,.mp3,.m4a"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          setBusy(true)
          setError('')
          void uploadAudio(file)
            .then(onUploaded)
            .catch((cause) => setError(cause instanceof Error ? cause.message : 'Không tải được nhạc'))
            .finally(() => setBusy(false))
        }}
      />
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function numberOrZero(value: string) {
  const number = Number(value.trim().replace(',', '.'))
  return Number.isFinite(number) ? number : 0
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-stone-200 pt-6">
      <h2 className="font-invite text-3xl">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-400 sm:text-sm"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-400 sm:text-sm"
      />
    </label>
  )
}
