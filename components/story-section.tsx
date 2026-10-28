import { CLASSIC_MODEL } from '@/lib/constants'
import type { SignatureLayout } from '@/components/signature-heroes'
import type { WeddingModel } from '@/lib/wedding-model'
import { SilkSprig } from './invitation-ornaments'
import { Reveal } from './reveal'

export function StorySection({
  model = CLASSIC_MODEL,
  dress,
  layout,
}: {
  model?: WeddingModel
  dress?: SignatureLayout
  layout?: string
}) {
  const LOVE_STORY = model.loveStory
  if (!model.hasStory) return null
  if (layout === 'veil') {
    return (
      <section id="cau-chuyen" className="scroll-mt-16 py-16 sm:py-20 md:py-28">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <Reveal className="section-frame">
            <SilkSprig />
            <h2 className="heading-title mb-6 text-center font-serif text-4xl text-w-strong sm:mb-8 sm:text-5xl">{LOVE_STORY.title}</h2>
            {LOVE_STORY.story && (
              <p className="mx-auto mb-8 max-w-lg text-center text-base leading-relaxed text-w-text sm:text-lg">{LOVE_STORY.story}</p>
            )}
            <ol className="veil-story">
              {LOVE_STORY.timeline.map((item, index) => (
                <li key={`${item.date}-${item.event}-${index}`}>
                  <span className="veil-story-year">{item.date}</span>
                  <span className="veil-story-event">{item.event}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>
    )
  }
  if (dress) {
    return (
      <section id="cau-chuyen" data-story={dress} className="sig-story scroll-mt-16 py-16 sm:py-24">
        <div className="sig-story-wrap mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="heading-title sig-story-title text-4xl text-w-strong sm:text-5xl">{LOVE_STORY.title}</h2>
          {LOVE_STORY.story && <p className="sig-story-lead mt-4 text-base leading-7 text-w-text sm:text-lg">{LOVE_STORY.story}</p>}
          <ol className="sig-story-list mt-8">
            {LOVE_STORY.timeline.map((item, index) => (
              <li key={`${item.date}-${item.event}-${index}`} className="sig-story-item">
                <p className="sig-story-date">{item.date}</p>
                <p className="sig-story-event">{item.event}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }
  return (
    <section id="cau-chuyen" className="py-16 sm:py-20 md:py-28 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal className="section-frame">
          <h2 className="heading-title text-4xl md:text-5xl font-serif font-bold text-w-strong mb-6 sm:mb-8 text-center">
            {LOVE_STORY.title}
          </h2>

          {LOVE_STORY.story && (
            <p className="text-base sm:text-lg text-w-text leading-relaxed text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
              {LOVE_STORY.story}
            </p>
          )}

          {/* Timeline dọc - nội dung xen kẽ trái-phải */}
          <div className="relative">
            <div className="timeline-track" aria-hidden>
              <span className="timeline-fill" />
            </div>
            <ol>
              {LOVE_STORY.timeline.map((item, i) => {
                const isLeft = i % 2 === 0
                const content = (
                  <Reveal
                    delay={120}
                    variant={isLeft ? 'left' : 'right'}
                    className={`max-w-[85%] sm:max-w-[75%] ${isLeft ? 'text-right' : 'text-left'}`}
                  >
                    <p className="font-bold text-w-strong text-base sm:text-lg">{item.date}</p>
                    <p className="text-w-soft text-sm sm:text-base mt-0.5">{item.event}</p>
                  </Reveal>
                )
                return (
                  <li key={`${item.date}-${item.event}-${i}`} className="relative flex items-center min-h-[4rem] py-6 first:pt-0 last:pb-0">
                    <div className="flex-1 flex justify-end pr-6 sm:pr-8">{isLeft && content}</div>
                    <div
                      className="timeline-dot w-4 h-4 rounded-full bg-w-gold border-2 border-white shadow-md shrink-0 z-10"
                      aria-hidden
                    />
                    <div className="flex-1 flex justify-start pl-6 sm:pl-8">{!isLeft && content}</div>
                  </li>
                )
              })}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
