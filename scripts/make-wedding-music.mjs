/**
 * Kho nhạc nền gốc của Tơ Hồng.
 * Mỗi bài là một giai điệu soạn mới, tổng hợp trong script này, rồi ghi MP3.
 * Không dùng bản thu thương mại.
 *
 * Cần gói @breezystack/lamejs (không ghi vào package.json):
 *   npm install --no-save @breezystack/lamejs
 *   node scripts/make-wedding-music.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import lame from '@breezystack/lamejs'

const rate = 22050
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'music')

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12)
}

function voice(samples, { freq, start, dur, amp, kind }) {
  const a0 = Math.floor(start * rate)
  const n = Math.floor(dur * rate)
  for (let i = 0; i < n && a0 + i < samples.length; i++) {
    const t = i / rate
    let s = 0
    if (kind === 'piano') {
      const env = Math.exp(-t * 1.8) * (1 - Math.exp(-t * 70))
      s =
        Math.sin(2 * Math.PI * freq * t) * 0.72 +
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.26 * Math.exp(-t * 2.4) +
        Math.sin(2 * Math.PI * freq * 3 * t) * 0.1 * Math.exp(-t * 3.6) +
        Math.sin(2 * Math.PI * freq * 4 * t) * 0.05 * Math.exp(-t * 5)
      s *= env
    } else if (kind === 'pluck') {
      const env = Math.exp(-t * 2.8) * (1 - Math.exp(-t * 140))
      s = Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 2 * t) * 0.32 * Math.exp(-t * 5)
      s *= env
    } else if (kind === 'bell') {
      const env = Math.exp(-t * 1.15) * (1 - Math.exp(-t * 30))
      s =
        Math.sin(2 * Math.PI * freq * t) * 0.55 +
        Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.22 +
        Math.sin(2 * Math.PI * freq * 2.76 * t) * 0.16 * Math.exp(-t * 1.5) +
        Math.sin(2 * Math.PI * freq * 5.4 * t) * 0.08 * Math.exp(-t * 2)
      s *= env
    } else if (kind === 'pad') {
      const attack = Math.min(1, t / 0.9)
      const release = Math.min(1, Math.max(0, (dur - t) / 1.1))
      const env = Math.min(attack, release)
      s = Math.sin(2 * Math.PI * freq * t) * 0.55 + Math.sin(2 * Math.PI * freq * 1.004 * t) * 0.45
      s *= env
    } else if (kind === 'bass') {
      const env = Math.exp(-t * 1.7) * (1 - Math.exp(-t * 35))
      s = Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 2 * t) * 0.12 * Math.exp(-t * 3)
      s *= env
    } else if (kind === 'tick') {
      const env = Math.exp(-t * 28)
      s = Math.sin(2 * Math.PI * freq * t) * env
    }
    samples[a0 + i] += s * amp
  }
}

function tone(note, start, dur, amp, kind) {
  return { freq: midi(note), start, dur, amp, kind }
}

function finish(samples, fade = 0.35) {
  const n = Math.floor(fade * rate)
  for (let i = 0; i < n && i < samples.length; i++) {
    const g = i / n
    samples[i] *= g
    samples[samples.length - 1 - i] *= g
  }
  let peak = 0
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample))
  const gain = peak > 0 ? 0.86 / peak : 1
  for (let i = 0; i < samples.length; i++) samples[i] *= gain
  return samples
}

function bed(seconds) {
  return new Float64Array(Math.floor(seconds * rate))
}

function echo(samples, ms, gain) {
  const d = Math.floor((ms / 1000) * rate)
  for (let i = d; i < samples.length; i++) samples[i] += samples[i - d] * gain
}

const songs = {
  'dan.mp3': () => {
    const beat = 0.58
    const notes = [74, 76, 78, 81, 83, 81, 78, 76, 74, null, 78, 81, 83, 86, 83, 81, 78, 74, null, null, 76, 78, 81, 78, 76, 74, 78, 81, 74]
    const samples = bed(notes.length * beat + 2.2)
    notes.forEach((note, index) => {
      if (note == null) return
      voice(samples, tone(note, index * beat, beat * 1.7, 0.42, 'pluck'))
      voice(samples, tone(note - 12, index * beat, beat * 1.5, 0.12, 'pluck'))
    })
    echo(samples, 280, 0.22)
    return finish(samples, 0.45)
  },
  'sao.mp3': () => {
    const samples = bed(26)
    const chords = [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
      [57, 60, 64],
    ]
    chords.forEach((chord, index) => {
      for (const note of chord) voice(samples, tone(note, index * 4.6, 6.2, 0.16, 'pad'))
    })
    ;[76, 79, 84, 81, 76, 88, 84, 79, 76].forEach((note, index) => {
      voice(samples, tone(note, 1.2 + index * 2.5, 3.2, 0.2, 'bell'))
    })
    echo(samples, 420, 0.28)
    return finish(samples, 0.8)
  },
  'van.mp3': () => {
    const beat = 0.46
    const bars = 16
    const samples = bed(bars * beat * 3 + 1.4)
    const roots = [48, 43, 45, 41]
    const melody = [76, 79, 81, 79, 77, 76, 74, 72, 74, 76, 77, 76, 74, 72, 74, 76, 79, 81, 84, 81, 79, 77, 76, 74, 72, 74, 76, 79, 77, 76, 74, 72]
    for (let bar = 0; bar < bars; bar++) {
      const root = roots[bar % roots.length]
      const at = bar * beat * 3
      voice(samples, tone(root, at, beat * 2.2, 0.34, 'bass'))
      voice(samples, tone(root + 12, at + beat, beat * 0.9, 0.12, 'piano'))
      voice(samples, tone(root + 16, at + beat, beat * 0.9, 0.1, 'piano'))
      voice(samples, tone(root + 19, at + beat * 2, beat * 0.9, 0.1, 'piano'))
    }
    melody.forEach((note, index) => {
      voice(samples, tone(note, index * (beat * 1.5), beat * 1.6, 0.28, 'piano'))
    })
    echo(samples, 240, 0.16)
    return finish(samples, 0.12)
  },
  'pho.mp3': () => {
    const step = 0.27
    const walk = [43, 45, 47, 48, 50, 52, 50, 48, 47, 45, 43, 40, 41, 43, 45, 47]
    const phrase = [67, null, 71, 72, 74, null, 72, 71, 67, 69, 71, null, 74, 76, 74, 72, 71, null, 72, 74, 76, 79, 76, 74, 72, 71, 69, 67, null, null, 71, 74]
    const melody = phrase.concat(phrase)
    const samples = bed(melody.length * step + 1.6)
    walk.forEach((note, index) => {
      const hops = Math.ceil(melody.length / walk.length)
      for (let hop = 0; hop < hops; hop++) {
        const at = (index + hop * walk.length) * step
        if (at > melody.length * step) break
        voice(samples, tone(note, at, step * 0.95, 0.22, 'bass'))
      }
    })
    melody.forEach((note, index) => {
      if (note == null) return
      voice(samples, tone(note, index * step, step * 1.35, 0.3, 'piano'))
    })
    echo(samples, 180, 0.14)
    return finish(samples, 0.1)
  },
  'cung.mp3': () => {
    const samples = bed(24)
    voice(samples, tone(43, 0, 23, 0.16, 'pad'))
    voice(samples, tone(50, 0, 23, 0.1, 'pad'))
    voice(samples, tone(55, 0, 23, 0.06, 'pad'))
    const bells = [67, 70, 74, 77, 74, 70, 67, 74, 79, 77, 74, 70, 67, 74, 70, 67]
    bells.forEach((note, index) => {
      voice(samples, tone(note, 0.6 + index * 1.35, 2.4, 0.22, 'bell'))
    })
    echo(samples, 360, 0.24)
    return finish(samples, 0.7)
  },
  'song.mp3': () => {
    const step = 0.16
    const wave = [64, 67, 71, 74, 76, 74, 71, 67]
    const cycles = 16
    const samples = bed(cycles * wave.length * step + 2)
    for (let cycle = 0; cycle < cycles; cycle++) {
      wave.forEach((note, index) => {
        const at = (cycle * wave.length + index) * step
        voice(samples, tone(note, at, step * 1.8, 0.2, 'pluck'))
      })
    }
    voice(samples, tone(52, 0, 22, 0.1, 'pad'))
    voice(samples, tone(59, 0, 22, 0.07, 'pad'))
    echo(samples, 320, 0.26)
    return finish(samples, 0.4)
  },
  'hoi.mp3': () => {
    const beat = 0.3
    const phrase = [74, 76, 79, 81, 84, 81, 79, 76, 81, 84, 88, 84, 81, 79, 76, 74, 79, 81, 84, 86, 84, 81, 79, 76, 74, 76, 79, 74]
    const notes = phrase.concat(phrase)
    const samples = bed(notes.length * beat + 1.8)
    notes.forEach((note, index) => {
      voice(samples, tone(note, index * beat, beat * 1.5, 0.22, 'bell'))
      if (index % 2 === 0) voice(samples, tone(note - 12, index * beat, beat * 1.2, 0.12, 'pluck'))
      if (index % 4 === 0) voice(samples, tone(note - 24, index * beat, beat * 1.6, 0.2, 'bass'))
    })
    echo(samples, 200, 0.16)
    return finish(samples, 0.12)
  },
  'mai.mp3': () => {
    const step = 0.2
    const alberti = [60, 64, 67, 64, 60, 65, 69, 65, 59, 62, 67, 62, 60, 64, 67, 64]
    const melody = [72, 76, 79, 76, 74, 72, 74, 76, 79, 84, 79, 76, 74, 72, 71, 72]
    const cycles = 4
    const samples = bed(cycles * alberti.length * step + 1.6)
    for (let cycle = 0; cycle < cycles; cycle++) {
      alberti.forEach((note, index) => {
        voice(samples, tone(note, (cycle * alberti.length + index) * step, step * 1.3, 0.14, 'piano'))
      })
    }
    melody.forEach((note, index) => {
      voice(samples, tone(note, index * step * 4, step * 3.2, 0.28, 'piano'))
    })
    echo(samples, 220, 0.15)
    return finish(samples, 0.2)
  },
  'ky.mp3': () => {
    const samples = bed(24)
    const notes = [
      [0, 60],
      [1.7, 64],
      [2.6, 67],
      [5.1, 72],
      [6.4, 67],
      [8.8, 64],
      [10.2, 69],
      [13.4, 65],
      [15.1, 62],
      [18.2, 60],
      [20.4, 64],
    ]
    for (const [start, note] of notes) {
      voice(samples, tone(note, start, 2.8, 0.34, 'piano'))
      voice(samples, tone(note - 12, start, 3.2, 0.1, 'piano'))
    }
    echo(samples, 380, 0.2)
    return finish(samples, 0.6)
  },
  'nhip.mp3': () => {
    const beat = 0.5
    const bars = 40
    const samples = bed(bars * beat + 1.2)
    const melody = [62, null, 64, 65, null, 69, 72, null, 69, 65, null, 62, 67, null, 65, 64, 62, null, 69, 67]
    for (let index = 0; index < bars; index++) {
      voice(samples, tone(index % 4 === 0 ? 90 : 180, index * beat, 0.07, index % 4 === 0 ? 0.16 : 0.07, 'tick'))
    }
    melody.forEach((note, index) => {
      if (note == null) return
      const hops = Math.ceil(bars / melody.length)
      for (let hop = 0; hop < hops; hop++) {
        const at = (index + hop * melody.length) * beat
        if (at >= bars * beat) break
        voice(samples, tone(note, at, beat * 1.4, 0.24, 'piano'))
      }
    })
    echo(samples, 160, 0.12)
    return finish(samples, 0.08)
  },
}

mkdirSync(outDir, { recursive: true })

function writeMp3(file, samples) {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = (s * 32767) | 0
  }
  const encoder = new lame.Mp3Encoder(1, rate, 96)
  const chunks = []
  const block = 1152
  for (let i = 0; i < pcm.length; i += block) {
    const buf = encoder.encodeBuffer(pcm.subarray(i, i + block))
    if (buf.length) chunks.push(Buffer.from(buf))
  }
  const end = encoder.flush()
  if (end.length) chunks.push(Buffer.from(end))
  const path = join(outDir, file)
  writeFileSync(path, Buffer.concat(chunks))
  return path
}

for (const [file, build] of Object.entries(songs)) {
  const path = writeMp3(file, build())
  console.log(path)
}
