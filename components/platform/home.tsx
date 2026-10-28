import { SiteChrome } from '@/components/platform/site-chrome'
import { TemplateCatalog, type CatalogCard } from '@/components/platform/template-catalog'
import { CONTENT } from '@/lib/content'
import { sampleContent } from '@/lib/platform/content'
import { albumById, giftById, openingById, trackBySrc } from '@/lib/platform/experience'
import { CLASSIC_SLUG, TEMPLATES } from '@/lib/platform/templates'
import { present } from '@/lib/platform/view'

const STEPS = [
  { n: '01', title: 'Chọn mẫu và điền tên', text: 'Mẫu đã có cách mở và nhạc. Bạn điền tên, ngày và nơi. Đổi mẫu sau không mất chữ.' },
  { n: '02', title: 'Gửi một link', text: 'Khách mở trên điện thoại, không cần cài gì. Bàn khách chép lời mời và mở Zalo.' },
  { n: '03', title: 'Xem khách trả lời', text: 'Ai đến, đi mấy người, nhà trai hay nhà gái. Sửa thiệp sau đó, link đã gửi vẫn giữ.' },
]

const FEATURES = [
  ['Một link', 'Mọi khách mở cùng một đường dẫn và tự gõ tên khi xác nhận. Muốn lời mời ghi sẵn tên thì tạo link riêng ở bàn khách.'],
  ['Khách trả lời', 'Có đến hay không, số người, bên nhà trai hay nhà gái. Danh sách xuất được file.'],
  ['Mừng cưới', 'Mã QR và số tài khoản là của hai bạn. Tiền đi thẳng vào tài khoản đó, Tơ Hồng không đứng giữa.'],
  ['Sửa sau khi gửi', 'Đổi giờ, đổi nơi, rồi bấm Cập nhật. Link đã nhắn cho khách không đổi.'],
  ['Cách mở và nhạc', 'Phong bì, rèm, ánh sáng hoặc cánh hoa. Kho nhạc MP3 có đàn tranh, valse, sóng, đèn hội. Hoặc tải bài của hai bạn.'],
  ['Sổ lưu bút', 'Khách để lời chúc trên thiệp. Chủ thiệp đọc trong xưởng.'],
]

const QUESTIONS = [
  ['Viết thiệp có mất phí không?', 'Viết và xem thử không mất phí, tối đa 3 thiệp nháp. Xuất bản một thiệp thì đồng giá 150.000 đ, mọi mẫu như nhau. Studio 990.000 đ cho 30 ngày và tối đa 30 thiệp.'],
  ['Thiệp mở được bao lâu?', 'Gói Một thiệp mở đến 45 ngày sau lễ, rồi khép: khách vẫn đọc được, và không gửi thêm xác nhận hay lời chúc. Thiệp đã xuất bản bằng Studio vẫn mở đến sau lễ.'],
  ['Khách có cần cài ứng dụng không?', 'Không. Khách bấm link là thấy thiệp trên trình duyệt điện thoại.'],
  ['Gửi rồi có sửa được không?', 'Có. Link đã gửi giữ nguyên. Nội dung mới hiện sau khi bạn bấm Cập nhật.'],
  ['Tiền mừng có đi qua Tơ Hồng không?', 'Không. Hộp mừng là tài khoản của hai bạn. Khoản trả cho Tơ Hồng chỉ là phí xuất bản thiệp, qua VNPAY hoặc chuyển khoản theo hóa đơn.'],
]

const inkButton =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-[#4a1520] px-5 text-sm text-[#f8f1e7] transition hover:bg-[#3a1018] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a1520]/50'
const ghostButton =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white/70 px-5 text-sm text-stone-800 transition hover:border-stone-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a1520]/40'

export function PlatformHome({ signedIn = false }: { signedIn?: boolean }) {
  const classic = present(CONTENT)
  const studio = signedIn ? '/studio' : '/dang-nhap?next=%2Fstudio'
  const cards: CatalogCard[] = TEMPLATES.map((template) => {
    const real = template.id === 'trang-dat'
    const view = present(real ? CONTENT : sampleContent(template.id))
    return {
      id: template.id,
      name: template.name,
      mood: template.mood,
      blurb: template.blurb,
      opening: openingById(template.opening).name,
      track: trackBySrc(template.track)?.name ?? 'Nhạc riêng',
      album: albumById(template.album).name,
      gift: giftById(template.gift).name,
      href: real ? `/thiep/${CLASSIC_SLUG}` : `/mau/${template.id}`,
      studioHref: `/studio?mau=${template.id}`,
      face: {
        mood: template.mood,
        ink: template.ink,
        swatch: template.swatch,
        monogram: view.monogram,
        groom: view.names.groom,
        bride: view.names.bride,
        date: view.date?.full ?? '',
        layout: template.layout,
      },
    }
  })
  return (
    <SiteChrome>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 pt-8 pb-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(240px,0.72fr)] lg:pt-10 lg:pb-12">
        <div>
          <p className="text-[11px] tracking-[0.38em] text-[#8a5a3a] uppercase">Thiệp cưới online</p>
          <h1 className="mt-3 max-w-xl font-invite text-4xl leading-[0.95] text-balance text-stone-950 sm:text-5xl lg:text-6xl">
            Một thiệp đủ lễ,
            <span className="mt-1 block font-invite-alt italic font-normal text-[#4a1520]">gửi bằng một link.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-stone-600">
            Chọn mẫu, viết tên hai bạn, ngày và nơi tổ chức. Khách mở điện thoại là thấy thiệp, xác nhận tham dự và để lại lời chúc.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={studio} className={inkButton}>
              Bắt đầu một thiệp
            </a>
            <a href="#mau" className={ghostButton}>
              Xem các mẫu
            </a>
          </div>
          <p className="mt-4 text-sm text-stone-500">Viết miễn phí · Không cần cài ứng dụng · Link đã gửi vẫn giữ khi sửa</p>
        </div>

        <div className="relative mx-auto w-full max-w-[280px]">
          <div
            aria-hidden
            className="absolute top-6 -left-3 h-[92%] w-[88%] rotate-[-7deg] rounded-[1.4rem] shadow-lg"
            style={{ background: 'linear-gradient(160deg, #fff1f4 0%, #e7a3b5 100%)' }}
          />
          <a
            href={`/thiep/${CLASSIC_SLUG}`}
            className="relative block overflow-hidden rounded-[1.4rem] text-[#f8f1e4] shadow-[0_24px_50px_-28px_rgba(74,21,32,0.7)] ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a1520]"
            style={{ background: 'linear-gradient(165deg, #8d1b30 0%, #420a10 100%)' }}
          >
            <div className="pointer-events-none absolute inset-2.5 rounded-[1.1rem] border border-[#f8f1e4]/35" />
            <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-8 text-center">
              <p className="text-[10px] tracking-[0.36em] uppercase opacity-75">Thiệp gốc</p>
              <span aria-hidden className="mt-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#f8f1e4]/45 font-invite text-lg">
                {classic.monogram}
              </span>
              <p className="mt-4 font-invite text-4xl leading-none">{classic.names.groom}</p>
              <p className="my-2 text-[10px] tracking-[0.45em] opacity-70">&amp;</p>
              <p className="font-invite text-4xl leading-none">{classic.names.bride}</p>
              {classic.date?.full && <p className="mt-4 text-sm tracking-[0.16em] opacity-85">{classic.date.full}</p>}
              <span className="mt-5 rounded-full border border-[#f8f1e4]/40 px-4 py-1.5 text-[11px] tracking-[0.22em] uppercase">
                Mở thiệp
              </span>
            </div>
          </a>
        </div>
      </section>

      <section id="cach-lam" className="scroll-mt-20 border-y border-stone-900/10">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-3 md:gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-3">
              <p className="font-invite text-2xl leading-none text-[#8a5a3a]">{step.n}</p>
              <div>
                <h2 className="text-base font-medium">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-10">
        <TemplateCatalog cards={cards} />
      </div>

      <section className="border-t border-stone-900/10">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">Trong mỗi thiệp</p>
          <h2 className="mt-2 max-w-md font-invite text-4xl leading-[0.95]">Khách mở ra là thấy cả buổi lễ.</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, text]) => (
              <li key={title}>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="hoi-dap" className="scroll-mt-20 border-t border-stone-900/10">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <p className="text-[11px] tracking-[0.32em] text-[#8a5a3a] uppercase">Câu hỏi thường gặp</p>
          <h2 className="mt-2 font-invite text-4xl">Trước khi gửi link cho khách</h2>
          <div className="mt-5 divide-y divide-stone-900/10 border-y border-stone-900/10">
            {QUESTIONS.map(([question, answer]) => (
              <details key={question} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <span aria-hidden className="text-stone-400 group-open:hidden">+</span>
                  <span aria-hidden className="hidden text-stone-400 group-open:inline">–</span>
                </summary>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-stone-500">
            Không thấy câu của bạn? <a href="/lien-he" className="underline">Nhắn Tơ Hồng</a>
          </p>
        </div>
      </section>

      <section className="border-t border-stone-900/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8">
          <h2 className="font-invite text-3xl leading-none sm:text-4xl">Viết một lần, gửi một link.</h2>
          <a href={studio} className={inkButton}>Bắt đầu một thiệp</a>
        </div>
      </section>
    </SiteChrome>
  )
}
