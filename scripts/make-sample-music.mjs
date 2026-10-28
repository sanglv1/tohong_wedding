import { writeFileSync } from 'node:fs'

const rate = 22050

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12)
}

function writeWav(path, samples) {
  const dataSize = samples.length * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(rate, 24)
  buf.writeUInt32LE(rate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  writeFileSync(path, buf)
}

function pluck(samples, freq, start, dur, amp, bright) {
  const a0 = Math.floor(start * rate)
  const n = Math.floor(dur * rate)
  for (let i = 0; i < n && a0 + i < samples.length; i++) {
    const t = i / rate
    const env = Math.exp(-t * (2.4 + bright)) * (1 - Math.exp(-t * 90))
    let s = Math.sin(2 * Math.PI * freq * t)
    s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.28 * Math.exp(-t * 5)
    s += Math.sin(2 * Math.PI * freq * 3 * t) * bright * 0.12 * Math.exp(-t * 7)
    samples[a0 + i] += s * env * amp
  }
}

function song({ seconds, beat, root, notes, bright, pad }) {
  const samples = new Float64Array(Math.floor(seconds * rate))
  notes.forEach((note, index) => {
    if (note == null) return
    pluck(samples, midi(note), index * beat, beat * 1.8, 0.55, bright)
    pluck(samples, midi(note - 12), index * beat, beat * 1.6, 0.16, 0.2)
  })
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate
    const edge = Math.min(1, t / 0.6, (seconds - t) / 0.7)
    samples[i] += Math.sin(2 * Math.PI * midi(root) * t) * pad * edge
    samples[i] += Math.sin(2 * Math.PI * midi(root + 7) * t) * pad * 0.45 * edge
  }
  let peak = 0
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample))
  if (peak > 0) {
    const gain = 0.82 / peak
    for (let i = 0; i < samples.length; i++) samples[i] *= gain
  }
  return samples
}

const pieces = {
  'thu.wav': song({
    seconds: 16, beat: 0.72, root: 60, bright: 0.35, pad: 0.08,
    notes: [72, 76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 76, 72, null, 72, 76, 74, 72, null, null, null],
  }),
  'vuon.wav': song({
    seconds: 14, beat: 0.48, root: 67, bright: 0.7, pad: 0.1,
    notes: [67, 71, 74, 76, 74, 71, 69, 67, 71, 74, 79, 76, 74, 71, 67, null, 69, 71, 74, 71, 67, null, null],
  }),
  'sen.wav': song({
    seconds: 18, beat: 0.9, root: 62, bright: 0.15, pad: 0.12,
    notes: [62, 65, 69, 72, 69, 65, 62, null, 65, 69, 67, 65, 62, null, null, null],
  }),
  'la.wav': song({
    seconds: 15, beat: 0.55, root: 64, bright: 0.55, pad: 0.09,
    notes: [64, 67, 71, 72, 71, 67, 64, 67, 72, 71, 67, 64, 62, 64, null, 67, 71, 67, 64, null],
  }),
  'dat.wav': song({
    seconds: 16, beat: 0.64, root: 57, bright: 0.25, pad: 0.14,
    notes: [57, 60, 64, 67, 64, 60, 57, 60, 64, 69, 67, 64, 60, 57, null, 60, 64, 60, 57, null],
  }),
  'dem.wav': song({
    seconds: 18, beat: 0.8, root: 52, bright: 0.12, pad: 0.16,
    notes: [52, 55, 59, 62, 59, 55, 52, null, 55, 58, 62, 59, 55, 52, null, null, null],
  }),
  'sang.wav': song({
    seconds: 14, beat: 0.42, root: 72, bright: 0.9, pad: 0.06,
    notes: [72, 74, 76, 79, 81, 79, 76, 74, 76, 79, 84, 81, 79, 76, 74, 72, null, 76, 79, 76, 72, null],
  }),
  'bien.wav': song({
    seconds: 16, beat: 0.66, root: 65, bright: 0.4, pad: 0.11,
    notes: [65, 69, 72, 77, 72, 69, 65, 69, 72, 76, 72, 69, 65, null, 69, 72, 69, 65, null, null],
  }),
}

for (const [name, samples] of Object.entries(pieces)) {
  writeWav(new URL(`../public/music/${name}`, import.meta.url), samples)
  console.log(name, samples.length)
}
