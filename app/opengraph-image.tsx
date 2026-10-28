import { ImageResponse } from 'next/og'

export const alt = 'Tơ Hồng — Thiệp cưới online'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: '#420a10',
          color: '#f8f1e4',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6 }}>TƠ HỒNG</div>
        <div style={{ fontSize: 76, lineHeight: 1.05, marginTop: 18 }}>Thiệp cưới online</div>
      </div>
    ),
    { ...size },
  )
}
