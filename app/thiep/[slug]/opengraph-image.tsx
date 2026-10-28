import { ImageResponse } from 'next/og'
import { CONTENT } from '@/lib/content'
import { publicContent } from '@/lib/platform/save-plan'
import { getInvitationBySlug } from '@/lib/platform/store'
import { CLASSIC_SLUG } from '@/lib/platform/templates'
import { deriveWedding } from '@/lib/wedding-model'

export const runtime = 'nodejs'
export const alt = 'Thiệp cưới'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let groom = 'Chú rể'
  let bride = 'Cô dâu'
  let date = ''
  try {
    if (slug === CLASSIC_SLUG) {
      const model = deriveWedding(CONTENT)
      groom = model.wedding.groomShort
      bride = model.wedding.brideShort
      date = model.wedding.date
    } else {
      const invite = await getInvitationBySlug(slug)
      if (invite?.published) {
        const model = deriveWedding(publicContent(invite))
        groom = model.wedding.groomShort
        bride = model.wedding.brideShort
        date = model.wedding.date
      }
    }
  } catch {
    groom = 'Thiệp cưới'
    bride = ''
  }

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
        <div style={{ fontSize: 28, letterSpacing: 6 }}>THIỆP CƯỚI</div>
        <div style={{ fontSize: 72, lineHeight: 1.05, marginTop: 16 }}>
          {groom} & {bride}
        </div>
        <div style={{ fontSize: 32, marginTop: 18 }}>{date}</div>
      </div>
    ),
    { ...size },
  )
}
