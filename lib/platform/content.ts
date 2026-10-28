import { CONTENT, validateContent, type WeddingContent } from '@/lib/content'
import { isOpening } from './experience'
import { templateById, type TemplateLayout } from './templates'
import { safeHttp, safeMediaUrl } from './view'

export function starterContent(): WeddingContent {
  return {
    couple: {
      groom: '',
      bride: '',
      groomShort: '',
      brideShort: '',
      groomBrand: '',
      brideBrand: '',
    },
    event: {
      start: '2026-12-12T10:00',
      end: '2026-12-12T14:00',
      lunarDate: '',
      lunarYear: '',
      ceremonyName: 'Lễ thành hôn',
      ceremonyTime: '10:00',
      ceremonyVenue: '',
      location: '',
      mealName: 'Tiệc cưới',
      mealTime: '11:30',
      mealVenue: '',
      venueLat: 0,
      venueLng: 0,
    },
    addresses: {
      groomFamily: { address: '', mapsUrl: '' },
      brideFamily: { address: '', mapsUrl: '' },
    },
    family: {
      nhaTrai: { ong: '', ba: '' },
      nhaGai: { ong: '', ba: '' },
    },
    announcement: 'Trân trọng kính mời',
    story: { title: '', text: '', timeline: [] },
    hero: { src: '', focus: '50% 40%' },
    gallery: [],
    gift: {
      groom: { qrPath: '', name: 'Chú rể', bankName: '', accountNumber: '', accountName: '' },
      bride: { qrPath: '', name: 'Cô dâu', bankName: '', accountNumber: '', accountName: '' },
    },
    music: { playlist: [], volume: 0.5 },
  }
}

/** Thiệp mới theo mẫu: chữ vẫn trống, nhưng đã có hiệu ứng mở và bài nhạc của mẫu đó. */
export function seededContent(templateId: string): WeddingContent {
  const content = starterContent()
  const shell = templateById(templateId)
  content.opening = shell.opening
  content.music = { playlist: [shell.track], volume: 0.5 }
  return content
}

function demoGift(accountName: string, accountNumber: string, name: 'Chú rể' | 'Cô dâu', qrPath: string) {
  return { qrPath, name, bankName: 'Ngân hàng ví dụ', accountNumber, accountName }
}

function maps(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Mỗi kiểu bố cục một cặp tên và một bộ ảnh riêng, không dùng ảnh thiệp gốc. */
const SAMPLE_BY_LAYOUT: Partial<Record<TemplateLayout, WeddingContent>> = {
  editorial: {
    ...starterContent(),
    couple: {
      groom: 'Lê Minh Khang',
      bride: 'Ngô Hà My',
      groomShort: 'Minh Khang',
      brideShort: 'Hà My',
      groomBrand: 'Khang',
      brideBrand: 'My',
    },
    event: {
      start: '2027-04-18T09:30',
      end: '2027-04-18T13:00',
      lunarDate: '',
      lunarYear: '',
      ceremonyName: 'Lễ thành hôn',
      ceremonyTime: '09:30',
      ceremonyVenue: 'Tư gia',
      location: 'Số 24 phố Hàng Bạc, Hoàn Kiếm, Hà Nội',
      mealName: 'Tiệc trưa',
      mealTime: '11:30',
      mealVenue: 'Nhà hàng Mộc',
      venueLat: 21.031,
      venueLng: 105.852,
    },
    addresses: {
      groomFamily: { address: 'Số 24 phố Hàng Bạc, Hoàn Kiếm, Hà Nội', mapsUrl: maps('Hàng Bạc, Hoàn Kiếm, Hà Nội') },
      brideFamily: { address: 'Số 15 phố Nguyễn Thái Học, Ba Đình, Hà Nội', mapsUrl: maps('Nguyễn Thái Học, Ba Đình, Hà Nội') },
    },
    family: {
      nhaTrai: { ong: 'Lê Văn Khôi', ba: 'Đỗ Thị Lan' },
      nhaGai: { ong: 'Ngô Quang Hải', ba: 'Vũ Thị Yến' },
    },
    announcement: 'Thư mời lễ thành hôn',
    story: {
      title: 'Chuyện trên giấy',
      text: 'Minh Khang và Hà My gặp nhau một sáng mùa thu trong hiệu sách. Hai năm sau họ mời bạn về một bữa trà, một lời hứa, và một trang giấy để nhớ ngày ấy.',
      timeline: [
        { date: '2024', event: 'Gặp nhau ở hiệu sách' },
        { date: '2025', event: 'Chuyến tàu đầu tiên cùng đi' },
        { date: '2026', event: 'Lời hứa bên tách trà' },
        { date: '2027', event: 'Về chung một nhà' },
      ],
    },
    hero: { src: '/gallery/mau/editorial-bia.jpg', focus: '50% 58%' },
    gallery: [
      { src: '/gallery/mau/editorial-bia.jpg', alt: 'Chân dung Minh Khang và Hà My', caption: 'Chân dung ngày cưới' },
      { src: '/gallery/mau/editorial-2.jpg', alt: 'Minh Khang và Hà My bên bàn trà', caption: 'Một buổi trà' },
      { src: '/gallery/mau/editorial-3.jpg', alt: 'Minh Khang và Hà My đi dạo', caption: 'Đi dạo phố' },
      { src: '/gallery/mau/editorial-1.jpg', alt: 'Bàn trà', caption: 'Bàn trà sáng' },
    ],
    gift: {
      groom: demoGift('LE MINH KHANG', '1000000001', 'Chú rể', '/gallery/mau/qr-editorial-groom.png'),
      bride: demoGift('NGO HA MY', '1000000002', 'Cô dâu', '/gallery/mau/qr-editorial-bride.png'),
    },
    music: { playlist: ['/music/1.mp3'], volume: 0.5 },
  },
  garden: {
    ...starterContent(),
    couple: {
      groom: 'Phạm Tuấn Kiệt',
      bride: 'Đỗ Mai Anh',
      groomShort: 'Tuấn Kiệt',
      brideShort: 'Mai Anh',
      groomBrand: 'Kiệt',
      brideBrand: 'Mai',
    },
    event: {
      start: '2027-03-08T10:00',
      end: '2027-03-08T14:00',
      lunarDate: '',
      lunarYear: '',
      ceremonyName: 'Lễ thành hôn',
      ceremonyTime: '10:00',
      ceremonyVenue: 'Nhà vườn',
      location: 'Nhà vườn hoa đào, phường 4, Đà Lạt',
      mealName: 'Cơm thân mật',
      mealTime: '12:00',
      mealVenue: 'Nhà hàng Tùng',
      venueLat: 11.9404,
      venueLng: 108.4583,
    },
    addresses: {
      groomFamily: { address: 'Nhà vườn hoa đào, phường 4, Đà Lạt', mapsUrl: maps('Phường 4, Đà Lạt') },
      brideFamily: { address: 'Số 6 đường Hoa Hồng, Đà Lạt', mapsUrl: maps('Đường Hoa Hồng, Đà Lạt') },
    },
    family: {
      nhaTrai: { ong: 'Phạm Đức Long', ba: 'Trần Thị Hạnh' },
      nhaGai: { ong: 'Đỗ Minh Quân', ba: 'Lê Thị Nga' },
    },
    announcement: 'Kính mời về dự vui',
    story: {
      title: 'Vườn mùa xuân',
      text: 'Tuấn Kiệt và Mai Anh hẹn nhau dưới giàn đào. Mùa hoa năm ấy hai người quyết định mời cả nhà về vườn, ăn một bữa cơm và nhìn cánh hoa rơi.',
      timeline: [
        { date: '2024', event: 'Lần đầu dưới giàn đào' },
        { date: '2025', event: 'Mùa mưa Đà Lạt' },
        { date: '2026', event: 'Cầu hôn trong vườn' },
        { date: '2027', event: 'Tiệc dưới hoa' },
      ],
    },
    hero: { src: '/gallery/mau/garden-bia.jpg', focus: '50% 40%' },
    gallery: [
      { src: '/gallery/mau/garden-bia.jpg', alt: 'Chân dung Tuấn Kiệt và Mai Anh', caption: 'Dưới giàn đào' },
      { src: '/gallery/mau/garden-2.jpg', alt: 'Tuấn Kiệt và Mai Anh trong vườn', caption: 'Đứng giữa hoa' },
      { src: '/gallery/mau/garden-3.jpg', alt: 'Tuấn Kiệt và Mai Anh trên ghế đá', caption: 'Ghế đá trong vườn' },
      { src: '/gallery/mau/garden-1.jpg', alt: 'Bàn trà trong vườn', caption: 'Bàn trà trong vườn' },
    ],
    gift: {
      groom: demoGift('PHAM TUAN KIET', '2000000001', 'Chú rể', '/gallery/mau/qr-garden-groom.png'),
      bride: demoGift('DO MAI ANH', '2000000002', 'Cô dâu', '/gallery/mau/qr-garden-bride.png'),
    },
    music: { playlist: ['/music/1.mp3'], volume: 0.5 },
  },
  poster: {
    ...starterContent(),
    couple: {
      groom: 'Vũ Đức Huy',
      bride: 'Lý Thanh Hà',
      groomShort: 'Đức Huy',
      brideShort: 'Thanh Hà',
      groomBrand: 'Huy',
      brideBrand: 'Hà',
    },
    event: {
      start: '2026-11-21T18:00',
      end: '2026-11-21T22:00',
      lunarDate: '',
      lunarYear: '',
      ceremonyName: 'Lễ thành hôn',
      ceremonyTime: '18:00',
      ceremonyVenue: 'Sảnh đêm',
      location: 'Sảnh đêm, Quận 1, Thành phố Hồ Chí Minh',
      mealName: 'Tiệc tối',
      mealTime: '19:30',
      mealVenue: 'Sảnh đêm',
      venueLat: 10.7769,
      venueLng: 106.7009,
    },
    addresses: {
      groomFamily: { address: 'Sảnh đêm, Quận 1, Thành phố Hồ Chí Minh', mapsUrl: maps('Quận 1, Hồ Chí Minh') },
      brideFamily: { address: 'Số 12 đường Nguyễn Huệ, Quận 1', mapsUrl: maps('Nguyễn Huệ, Quận 1, Hồ Chí Minh') },
    },
    family: {
      nhaTrai: { ong: 'Vũ Thành Nam', ba: 'Phạm Thu Trang' },
      nhaGai: { ong: 'Lý Văn Hòa', ba: 'Ngô Thị Kim' },
    },
    announcement: 'Đêm thành hôn',
    story: {
      title: 'Một đêm vàng',
      text: 'Đức Huy và Thanh Hà chọn buổi tối. Đèn hạ xuống, tên hai người đứng trên ảnh, và bữa tiệc bắt đầu khi thành phố vừa lên đèn.',
      timeline: [
        { date: '2023', event: 'Gặp nhau sau một buổi hòa nhạc' },
        { date: '2025', event: 'Chuyến đi xuyên đêm' },
        { date: '2026', event: 'Cầu hôn dưới đèn' },
      ],
    },
    hero: { src: '/gallery/mau/poster-bia.jpg', focus: '50% 42%' },
    gallery: [
      { src: '/gallery/mau/poster-bia.jpg', alt: 'Chân dung Đức Huy và Thanh Hà', caption: 'Đêm chụp hình' },
      { src: '/gallery/mau/poster-2.jpg', alt: 'Đức Huy và Thanh Hà bên bàn tiệc', caption: 'Bàn tiệc tối' },
      { src: '/gallery/mau/poster-3.jpg', alt: 'Đức Huy và Thanh Hà đứng cạnh nhau', caption: 'Đứng cạnh nhau' },
      { src: '/gallery/mau/poster-1.jpg', alt: 'Nến và nhẫn', caption: 'Nến trên bàn' },
    ],
    gift: {
      groom: demoGift('VU DUC HUY', '3000000001', 'Chú rể', '/gallery/mau/qr-poster-groom.png'),
      bride: demoGift('LY THANH HA', '3000000002', 'Cô dâu', '/gallery/mau/qr-poster-bride.png'),
    },
    music: { playlist: ['/music/1.mp3'], volume: 0.5 },
  },
  journal: {
    ...starterContent(),
    couple: {
      groom: 'Hoàng Anh Tú',
      bride: 'Phan Thảo Nhi',
      groomShort: 'Anh Tú',
      brideShort: 'Thảo Nhi',
      groomBrand: 'Tú',
      brideBrand: 'Nhi',
    },
    event: {
      start: '2027-02-14T16:00',
      end: '2027-02-14T20:00',
      lunarDate: '',
      lunarYear: '',
      ceremonyName: 'Lễ vu quy',
      ceremonyTime: '16:00',
      ceremonyVenue: 'Nhà cổ',
      location: 'Nhà cổ số 8 Nguyễn Thái Học, Hội An',
      mealName: 'Cơm chiều',
      mealTime: '18:00',
      mealVenue: 'Sân nhà cổ',
      venueLat: 15.8801,
      venueLng: 108.338,
    },
    addresses: {
      groomFamily: { address: 'Nhà cổ số 8 Nguyễn Thái Học, Hội An', mapsUrl: maps('Nguyễn Thái Học, Hội An') },
      brideFamily: { address: 'Số 21 Trần Phú, Hội An', mapsUrl: maps('Trần Phú, Hội An') },
    },
    family: {
      nhaTrai: { ong: 'Hoàng Văn Lộc', ba: 'Mai Thị Xuân' },
      nhaGai: { ong: 'Phan Đức Thịnh', ba: 'Huỳnh Thị Đào' },
    },
    announcement: 'Thiệp báo hỷ',
    story: {
      title: 'Nhật ký đất nung',
      text: 'Anh Tú viết ngày cưới thành một con số lớn. Thảo Nhi giữ những cánh hoa khô mang từ Hội An về. Đây là trang họ muốn bạn đọc trước khi tới.',
      timeline: [
        { date: '2024', event: 'Gặp ở phố cổ' },
        { date: '2025', event: 'Mùa hoa giấy' },
        { date: '2026', event: 'Hứa ở sân nhà cổ' },
      ],
    },
    hero: { src: '/gallery/mau/journal-bia.jpg', focus: '50% 58%' },
    gallery: [
      { src: '/gallery/mau/journal-bia.jpg', alt: 'Chân dung Anh Tú và Thảo Nhi', caption: 'Tường đất nung' },
      { src: '/gallery/mau/journal-2.jpg', alt: 'Anh Tú và Thảo Nhi ngồi cạnh nhau', caption: 'Ngồi bên bình hoa' },
      { src: '/gallery/mau/journal-3.jpg', alt: 'Anh Tú và Thảo Nhi đi dạo', caption: 'Đi dạo chiều' },
      { src: '/gallery/mau/journal-1.jpg', alt: 'Bình hoa khô', caption: 'Hoa khô trên bàn' },
    ],
    gift: {
      groom: demoGift('HOANG ANH TU', '4000000001', 'Chú rể', '/gallery/mau/qr-journal-groom.png'),
      bride: demoGift('PHAN THAO NHI', '4000000002', 'Cô dâu', '/gallery/mau/qr-journal-bride.png'),
    },
    music: { playlist: ['/music/1.mp3'], volume: 0.5 },
  },
}

/** Lời mời riêng của từng mẫu. Ảnh và tên cặp đôi vẫn theo bộ ảnh của mẫu, để mã QR ví dụ khớp tên. */
const SAMPLE_VOICE: Record<string, { announcement: string; title: string; text: string }> = {
  'sang-trang': {
    announcement: 'Thư mời một trang giấy',
    title: 'Ít chữ, đủ ngày',
    text: 'Minh Khang và Hà My để tên rất lớn, ảnh nằm dưới, và một câu ngắn. Họ muốn khách đọc xong trước khi trà nguội.',
  },
  'hong-dao': {
    announcement: 'Mời về vườn đào',
    title: 'Dưới giàn hoa',
    text: 'Tuấn Kiệt và Mai Anh mời khách đứng giữa hoa, nghe một bài, rồi vào cơm. Ảnh tròn như một cửa sổ nhìn ra vườn.',
  },
  'sen-trang': {
    announcement: 'Một ngày rất tĩnh',
    title: 'Sen vừa nở',
    text: 'Chân dung đứng trước, ngày cưới là một con số lớn phía dưới. Tuấn Kiệt và Mai Anh để khoảng lặng nhiều hơn lời.',
  },
  'rung-xanh': {
    announcement: 'Mời sang nhà lá',
    title: 'Đường lá',
    text: 'Ảnh đứng một bên, tên đứng một bên. Minh Khang và Hà My muốn thiệp như một lối đi trong vườn.',
  },
  'dat-nung': {
    announcement: 'Trang nhật ký',
    title: 'Ngày viết lớn',
    text: 'Anh Tú viết ngày cưới thành một con số. Thảo Nhi giữ hoa khô. Album chạy như một cuộn phim.',
  },
  'dem-vang': {
    announcement: 'Đêm ấy lên đèn',
    title: 'Tiệc khi thành phố sáng',
    text: 'Đức Huy và Thanh Hà chọn buổi tối. Ảnh đứng thành vòng, hộp mừng là một cái hộp mở nắp.',
  },
  'anh-sang': {
    announcement: 'Sáng sớm trước lễ',
    title: 'Ngày đặt phía dưới ảnh',
    text: 'Chân dung đứng trước, ngày lớn đứng sau. Đức Huy và Thanh Hà để mã mừng hiện sẵn, không cần mở phong bì.',
  },
  'bien-cat': {
    announcement: 'Mời ra phía biển',
    title: 'Gió và cát',
    text: 'Ảnh một bên, tên một bên. Minh Khang và Hà My để album thành lưới, khách bấm từng tấm.',
  },
  'song-hy': {
    announcement: 'Trân trọng báo hỷ',
    title: 'Hai chữ hỷ',
    text: 'Anh Tú và Thảo Nhi mời theo lối thiệp gập. Ảnh xếp chồng, hộp mừng vẫn là phong bì son.',
  },
  'giay-do': {
    announcement: 'Giấy mời lễ gia tiên',
    title: 'Chữ đứng trên giấy ngà',
    text: 'Minh Khang và Hà My viết lời mời ngắn như một tờ giấy dó. Album là dải phim, hộp mừng là một tấm thẻ.',
  },
  'thu-tay': {
    announcement: 'Một bức thư tay',
    title: 'Viết trước khi tới',
    text: 'Anh Tú viết ngày, Thảo Nhi viết nơi. Thiệp như nhật ký, album trượt chậm, ruy băng hộp mừng được kéo ra.',
  },
  'vuon-hong': {
    announcement: 'Mời vào vườn hồng',
    title: 'Hoa đậm hơn giấy',
    text: 'Tuấn Kiệt và Mai Anh chọn hồng đậm. Ảnh trải lưới, hộp mừng mở nắp như một hộp quà.',
  },
  'net-han': {
    announcement: 'Tên là dòng đầu',
    title: 'Không bìa',
    text: 'Minh Khang và Hà My bỏ bìa. Vào thiệp là thấy tên. Album chạy như phim, mã mừng hiện sẵn.',
  },
  'kinh-mo': {
    announcement: 'Phía sau lớp kính',
    title: 'Ảnh đứng trước chữ',
    text: 'Đức Huy và Thanh Hà để ảnh tràn màn hình. Album xếp như ảnh in, hộp mừng là thẻ lật.',
  },
  'son-vang': {
    announcement: 'Tiệc son vàng',
    title: 'Rèm kéo lúc lên đèn',
    text: 'Ảnh một bên, tên một bên. Đức Huy và Thanh Hà để album xoay vòng và hộp mừng là phong bì.',
  },
  'nha-tho': {
    announcement: 'Lời mời trang nghiêm',
    title: 'Ngà và vàng nhạt',
    text: 'Minh Khang và Hà My để chân dung trước, rồi ngày lớn. Album trượt, ruy băng hộp mừng được kéo ra.',
  },
  'la-oliu': {
    announcement: 'Mời dưới tán oliu',
    title: 'Lá và tên',
    text: 'Ảnh một bên, tên một bên. Tuấn Kiệt và Mai Anh để album thành dải phim, hộp mừng mở nắp.',
  },
  'suong-som': {
    announcement: 'Sương chưa tan',
    title: 'Chữ là phần chính',
    text: 'Anh Tú và Thảo Nhi bỏ bìa. Nền tím khói, album là lưới ảnh, mã mừng hiện ngay.',
  },
  'dao-tien': {
    announcement: 'Mời xem hoa rơi',
    title: 'Đào vừa nở',
    text: 'Tuấn Kiệt và Mai Anh để ảnh tròn. Album xếp chồng từng tấm, hộp mừng là thẻ lật.',
  },
  'hoa-nhai': {
    announcement: 'Thiệp trắng như nhài',
    title: 'Một bữa trà',
    text: 'Minh Khang và Hà My gập thiệp làm đôi. Album xoay vòng, ruy băng hộp mừng tuột ra khi chạm.',
  },
  'hoang-hon': {
    announcement: 'Khi trời vừa ngả',
    title: 'Nâu của buổi chiều',
    text: 'Đức Huy và Thanh Hà để ảnh tràn khung. Album là dải phim, hộp mừng là một cái hộp.',
  },
  'song-biec': {
    announcement: 'Mời theo con sóng',
    title: 'Xanh hơn cát',
    text: 'Anh Tú và Thảo Nhi đặt ngày lớn dưới chân dung. Album xoay vòng, hộp mừng là thẻ.',
  },
  'man-chin': {
    announcement: 'Mùa mận',
    title: 'Tím của vườn',
    text: 'Tuấn Kiệt và Mai Anh chọn tím mận. Ảnh tròn, album trượt, hộp mừng là phong bì.',
  },
  'tre-truc': {
    announcement: 'Ngày viết dưới tre',
    title: 'Một con số',
    text: 'Anh Tú để ngày thành con số lớn. Album trải lưới, hộp mừng mở nắp.',
  },
  'gam-do': {
    announcement: 'Thiệp gấm đỏ',
    title: 'Ảnh lớn, chữ son',
    text: 'Minh Khang và Hà My để ảnh phủ màn hình. Album xếp chồng, hộp mừng là phong bì đỏ.',
  },
  'no-lua': {
    announcement: 'Một nơ lụa hồng',
    title: 'Sổ nhỏ',
    text: 'Anh Tú và Thảo Nhi viết như một trang sổ. Album xoay vòng, hộp mừng là thẻ lật.',
  },
  'muc-nhat': {
    announcement: 'Mực còn nhạt',
    title: 'Chữ bên ảnh',
    text: 'Minh Khang và Hà My để ảnh một bên, chữ một bên. Album trượt chậm, mã mừng hiện sẵn.',
  },
  'ban-mai': {
    announcement: 'Ban mai trước giờ lễ',
    title: 'Vàng sớm',
    text: 'Đức Huy và Thanh Hà gập thiệp. Album chạy như phim, ruy băng hộp mừng được kéo ra.',
  },
  'muc-tau': {
    announcement: 'Thư viết dọc',
    title: 'Dấu son',
    text: 'Anh Tú và Thảo Nhi để tên chạy dọc trên cuộn giấy. Ảnh đứng giữa, dấu đỏ đóng bên cạnh. Album trượt chậm.',
  },
  'dem-sao': {
    announcement: 'Dưới một vệt sao',
    title: 'Đêm chưa tắt',
    text: 'Đức Huy và Thanh Hà để ảnh tròn giữa trời tối. Tên nằm hai đầu một đường kẻ. Album xoay vòng.',
  },
  'san-khau': {
    announcement: 'Đêm diễn',
    title: 'Tên trên đèn',
    text: 'Đức Huy và Thanh Hà in tên như bảng hiệu. Ngày cưới là một tấm vé. Album chạy như phim.',
  },
  'gach-bong': {
    announcement: 'Mời về nhà gạch',
    title: 'Ô hoa cũ',
    text: 'Minh Khang và Hà My đặt ảnh trong ô vuông xoay. Nền là hoa gạch. Album trải lưới.',
  },
  'cung-dinh': {
    announcement: 'Lễ trong khung son',
    title: 'Chữ hỷ',
    text: 'Anh Tú và Thảo Nhi để chữ hỷ lớn, ảnh nằm giữa hai đường viền vàng. Album xếp từng tấm.',
  },
  'song-nhe': {
    announcement: 'Theo một con sóng',
    title: 'Chân trời',
    text: 'Minh Khang và Hà My để ảnh thành một dải ngang. Tên viết nghiêng phía dưới sóng. Album trượt.',
  },
  'den-long': {
    announcement: 'Đêm hội đèn lồng',
    title: 'Cửa trăng',
    text: 'Tuấn Kiệt và Mai Anh để ảnh trong vòng tròn, hai đèn lồng hai bên. Album xoay vòng.',
  },
  'bao-xuan': {
    announcement: 'Tin vui số ra mắt',
    title: 'Dòng tít',
    text: 'Minh Khang và Hà My để ngày thành đầu báo. Ảnh như một mẩu tin. Không có bìa. Album chạy như phim.',
  },
  'so-tay': {
    announcement: 'Trang vừa viết',
    title: 'Giấy kẻ',
    text: 'Anh Tú dán ảnh hơi nghiêng. Thảo Nhi đóng dấu ngày. Album trượt như lật sổ.',
  },
  'kinh-manh': {
    announcement: 'Mời vào một mặt cắt',
    title: 'Các ô',
    text: 'Đức Huy và Thanh Hà tách tên, ngày và ảnh thành những ô lệch nhau. Album là lưới.',
  },
  'sang-nhung': {
    announcement: 'Trân trọng kính mời',
    title: 'Ánh sáng và nhung',
    text: 'Văn Sáng và Trần Nhung gặp nhau trong một buổi chiều rất nhẹ. Không có tiếng lớn. Chỉ một lời hứa đủ chậm để ở lại, và ngày này để những người thương cùng chứng kiến.',
  },
}

function dressSangNhung(content: WeddingContent) {
  content.couple = {
    groom: 'Văn Sáng',
    bride: 'Trần Nhung',
    groomShort: 'Văn Sáng',
    brideShort: 'Trần Nhung',
    groomBrand: 'Sáng',
    brideBrand: 'Nhung',
  }
  content.family = {
    nhaTrai: { ong: 'Văn Đức Hòa', ba: 'Lê Thị Mai' },
    nhaGai: { ong: 'Trần Văn Khôi', ba: 'Phạm Thị Lan' },
  }
  content.gift.groom.accountName = 'VAN SANG'
  content.gift.bride.accountName = 'TRAN NHUNG'
  content.gallery = content.gallery.map((photo) => ({
    ...photo,
    alt: photo.alt.replaceAll('Minh Khang và Hà My', 'Văn Sáng và Trần Nhung'),
  }))
  content.story.timeline = [
    { date: '2024', event: 'Một chiều rất nhẹ' },
    { date: '2025', event: 'Những ngày đi cùng, không vội' },
    { date: '2026', event: 'Lời hứa đủ chậm để ở lại' },
    { date: '2027', event: 'Mời bạn đến chứng kiến' },
  ]
}

function rotate<T>(items: T[], by: number) {
  if (items.length < 2) return items
  const n = ((by % items.length) + items.length) % items.length
  return items.slice(n).concat(items.slice(0, n))
}

/**
 * Nội dung xem thử.
 * Trang Đạt dùng đúng thiệp gốc. Mẫu khác lấy bộ ảnh theo cast, rồi đổi lời, thứ tự album, cách mở và nhạc.
 * Ảnh bìa giữ chân dung dọc để tên và ảnh cùng một trục, không lấy ảnh tĩnh ngang.
 */
export function sampleContent(templateId = 'sang-trang'): WeddingContent {
  const shell = templateById(templateId)
  const content = templateId === 'trang-dat'
    ? structuredClone(CONTENT)
    : structuredClone(SAMPLE_BY_LAYOUT[shell.cast] ?? SAMPLE_BY_LAYOUT.editorial!)
  content.opening = shell.opening
  content.music = { playlist: [shell.track], volume: 0.5 }
  if (templateId === 'sang-nhung') dressSangNhung(content)
  const voice = SAMPLE_VOICE[templateId]
  if (voice) {
    content.announcement = voice.announcement
    content.story = { ...content.story, title: voice.title, text: voice.text }
    const turn = [...templateId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    content.gallery = rotate(content.gallery, turn)
  }
  return content
}

function clip(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Chuẩn hóa nội dung người dùng gửi lên rồi kiểm tra.
 * Trả về thông báo lỗi, hoặc null nếu dùng được.
 */
export function sanitizeContent(content: WeddingContent): string | null {
  if (!content?.couple || !content.event || !content.addresses || !content.family || !content.story || !content.hero || !content.gift) {
    return 'Dữ liệu thiệp chưa đủ các phần'
  }
  content.addresses.groomFamily ??= { address: '', mapsUrl: '' }
  content.addresses.brideFamily ??= { address: '', mapsUrl: '' }
  content.family.nhaTrai ??= { ong: '', ba: '' }
  content.family.nhaGai ??= { ong: '', ba: '' }
  content.gift.groom ??= { qrPath: '', name: 'Chú rể', bankName: '', accountNumber: '', accountName: '' }
  content.gift.bride ??= { qrPath: '', name: 'Cô dâu', bankName: '', accountNumber: '', accountName: '' }
  content.couple.groom = clip(content.couple?.groom, 80)
  content.couple.bride = clip(content.couple?.bride, 80)
  content.couple.groomShort = clip(content.couple?.groomShort, 40)
  content.couple.brideShort = clip(content.couple?.brideShort, 40)
  content.couple.groomBrand = content.couple.groomShort || content.couple.groom
  content.couple.brideBrand = content.couple.brideShort || content.couple.bride

  const event = content.event
  event.lunarDate = clip(event?.lunarDate, 120)
  event.lunarYear = clip(event?.lunarYear, 40)
  event.ceremonyName = clip(event?.ceremonyName, 80)
  event.ceremonyTime = clip(event?.ceremonyTime, 40)
  event.ceremonyVenue = clip(event?.ceremonyVenue, 120)
  event.location = clip(event?.location, 200)
  event.mealName = clip(event?.mealName, 80)
  event.mealTime = clip(event?.mealTime, 40)
  event.mealVenue = clip(event?.mealVenue, 120)
  if (typeof event.venueLat !== 'number' || Number.isNaN(event.venueLat)) event.venueLat = 0
  if (typeof event.venueLng !== 'number' || Number.isNaN(event.venueLng)) event.venueLng = 0

  content.addresses.groomFamily.address = event.location
  content.addresses.groomFamily.mapsUrl = clip(content.addresses?.groomFamily?.mapsUrl, 500)
  content.addresses.brideFamily.address = clip(content.addresses?.brideFamily?.address, 200)
  content.addresses.brideFamily.mapsUrl = clip(content.addresses?.brideFamily?.mapsUrl, 500)

  content.family.nhaTrai.ong = clip(content.family?.nhaTrai?.ong, 80)
  content.family.nhaTrai.ba = clip(content.family?.nhaTrai?.ba, 80)
  content.family.nhaGai.ong = clip(content.family?.nhaGai?.ong, 80)
  content.family.nhaGai.ba = clip(content.family?.nhaGai?.ba, 80)

  content.announcement = clip(content.announcement, 400)
  content.story.title = clip(content.story?.title, 80)
  content.story.text = clip(content.story?.text, 2000)
  if (!Array.isArray(content.story.timeline)) content.story.timeline = []
  content.story.timeline = content.story.timeline
    .filter((item) => item && (typeof item.date === 'string' || typeof item.event === 'string'))
    .slice(0, 20)
    .map((item) => ({ date: clip(item.date, 40), event: clip(item.event, 160) }))
    .filter((item) => item.date || item.event)

  content.hero.src = clip(content.hero?.src, 500)
  content.hero.focus = clip(content.hero?.focus, 20) || '50% 40%'

  if (!Array.isArray(content.gallery)) content.gallery = []
  content.gallery = content.gallery
    .filter((photo) => photo && typeof photo.src === 'string' && photo.src.trim())
    .slice(0, 12)
    .map((photo) => ({
      src: photo.src.trim().slice(0, 500),
      alt: clip(photo.alt, 120) || 'Ảnh cưới',
      caption: clip(photo.caption, 160),
      focus: clip(photo.focus, 20) || undefined,
    }))

  for (const side of ['groom', 'bride'] as const) {
    const gift = content.gift?.[side]
    content.gift[side] = {
      qrPath: clip(gift?.qrPath, 500),
      name: clip(gift?.name, 40) || (side === 'groom' ? 'Chú rể' : 'Cô dâu'),
      bankName: clip(gift?.bankName, 80),
      accountNumber: clip(gift?.accountNumber, 30),
      accountName: clip(gift?.accountName, 80),
    }
  }

  if (!content.music || !Array.isArray(content.music.playlist)) content.music = { playlist: [], volume: 0.5 }
  content.music.playlist = content.music.playlist.map((item) => clip(item, 500)).filter(Boolean).slice(0, 8)
  if (typeof content.music.volume !== 'number' || Number.isNaN(content.music.volume)) content.music.volume = 0.5
  content.music.volume = Math.min(1, Math.max(0, content.music.volume))
  if (content.opening != null && !isOpening(content.opening)) delete content.opening

  const mediaError =
    mediaProblem(content.hero.src, 'Ảnh bìa') ||
    content.gallery.map((photo) => mediaProblem(photo.src, 'Ảnh album')).find(Boolean) ||
    mediaProblem(content.gift.groom.qrPath, 'Mã QR chú rể') ||
    mediaProblem(content.gift.bride.qrPath, 'Mã QR cô dâu') ||
    content.music.playlist.map((src) => mediaProblem(src, 'Nhạc nền')).find(Boolean) ||
    linkProblem(content.addresses.groomFamily.mapsUrl, 'Link bản đồ') ||
    linkProblem(content.addresses.brideFamily.mapsUrl, 'Link bản đồ nhà gái')
  if (mediaError) return mediaError

  return validateContent(content)
}

function mediaProblem(value: string, label: string) {
  if (!value.trim()) return null
  if (safeMediaUrl(value)) return null
  return `${label} không hợp lệ. Hãy tải ảnh lên, hoặc dán link https://`
}

function linkProblem(value: string, label: string) {
  if (!value.trim()) return null
  if (safeHttp(value)) return null
  return `${label} cần là đường dẫn http hoặc https`
}
