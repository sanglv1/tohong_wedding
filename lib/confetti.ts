/**
 * Hiệu ứng pháo phun - phun từ 2 bên dưới lên trên như thiệp cưới
 * Màu: trắng, vàng, đỏ
 */
import confetti from 'canvas-confetti'

const COLORS = ['#ffffff', '#d4a574', '#fcd34d', '#dc2626', '#b91c1c', '#fef3c7']

function fireFromBottomSide(originX: number, angle: number, count = 100, colors = COLORS) {
  confetti({
    origin: { x: originX, y: 1 },
    spread: 70,
    startVelocity: 45,
    colors,
    shapes: ['square', 'circle'],
    scalar: 0.9,
    ticks: 350,
    gravity: 0.5,
    drift: 0.2,
    particleCount: count,
    angle,
    disableForReducedMotion: true,
  })
}

const BURSTS: { delay: number; left: [number, number]; right: [number, number]; count?: number }[] = [
  { delay: 0, left: [0.15, 85], right: [0.85, 95] },
  { delay: 120, left: [0.12, 88], right: [0.88, 92], count: 120 },
  { delay: 280, left: [0.18, 86], right: [0.82, 94], count: 90 },
  { delay: 480, left: [0.15, 90], right: [0.85, 90], count: 70 },
  { delay: 700, left: [0.2, 88], right: [0.8, 92], count: 50 },
]

/** Chùm pháo nhỏ bung ra từ một điểm trên màn hình (toạ độ 0-1), dùng khi mở phong bì mừng cưới */
export function fireGiftBurst(x: number, y: number) {
  confetti({
    origin: { x, y },
    spread: 80,
    startVelocity: 28,
    colors: ['#d4a574', '#fcd34d', '#fef3c7', '#dc2626'],
    shapes: ['circle', 'square'],
    scalar: 0.8,
    ticks: 180,
    gravity: 0.8,
    particleCount: 60,
    angle: 90,
    zIndex: 60,
    disableForReducedMotion: true,
  })
}

const GOLD = ['#fff8e6', '#fef3c7', '#f5d78e', '#e8c88a', '#d4a574', '#c9a227']

/** Lúc hai cánh cửa thiệp mở: lấp lánh bung từ giữa, rồi pháo giấy hai bên. */
export function fireOpeningCelebration(colors?: string[]) {
  const sparkleColors = colors?.length ? colors : GOLD
  const paperColors = colors?.length ? colors : COLORS
  const sparkle = (particleCount: number, startVelocity: number, scalar: number) =>
    confetti({
      origin: { x: 0.5, y: 0.45 },
      spread: 360,
      startVelocity,
      colors: sparkleColors,
      shapes: ['star'],
      scalar,
      ticks: 220,
      gravity: 0.55,
      particleCount,
      zIndex: 120,
      disableForReducedMotion: true,
    })
  sparkle(70, 32, 1.1)
  setTimeout(() => sparkle(40, 20, 0.8), 150)
  setTimeout(() => fireWeddingConfetti(paperColors), 250)
}

export function fireWeddingConfetti(colors: string[] = COLORS) {
  for (const { delay, left, right, count } of BURSTS) {
    setTimeout(() => {
      fireFromBottomSide(left[0], left[1], count, colors)
      fireFromBottomSide(right[0], right[1], count, colors)
    }, delay)
  }
}
