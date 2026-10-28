# Tơ Hồng

Nền tảng thiệp cưới online. Khách chọn mẫu, viết lễ, xuất bản một link để người được mời xác nhận tham dự, gửi lời chúc và xem thông tin mừng cưới.

Next.js 16, React 19, Tailwind CSS 4. Node.js 22.

Trong repo còn thiệp gốc của Tiến Đạt & Huyền Trang. Thiệp đó dùng slug `tien-dat-huyen-trang` và không dùng tài khoản của nền tảng.

## Chạy trên máy

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Mở http://localhost:3000.

Kiểm tra trước khi deploy:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Chưa gắn Redis thì tài khoản, thiệp và đơn nằm trong `data/` (đã gitignore). Chưa gắn object storage thì ảnh và nhạc tải trong xưởng nằm trong `data/media`.

## Nền tảng

| Đường dẫn | Việc |
|---|---|
| `/` | Trang chủ Tơ Hồng |
| `/dang-ky`, `/dang-nhap`, `/quen-mat-khau` | Tài khoản email hoặc Facebook |
| `/studio` | Danh sách thiệp của tài khoản |
| `/gia`, `/don/[id]` | Gói và thanh toán |
| `/thiep/[slug]` | Thiệp khách xem |
| `/quan-tri-nen-tang` | Quản trị: tài khoản, đơn, sao lưu |

Mỗi tài khoản có nhiều thiệp. Lưu nháp không đổi bản khách đang xem. Khách chỉ thấy nội dung mới sau khi xuất bản hoặc cập nhật.

Gói **Một thiệp** là 150.000 đồng, xuất bản một thiệp, link mở tới 45 ngày sau lễ. Gói **Studio** là 990.000 đồng, 30 ngày, tối đa 30 thiệp. Lần xuất bản đầu cần đơn đã trả. Thiệp đã xuất bản được cập nhật tiếp. Quản trị không bị chặn bởi bước này.

## Biến môi trường

Mẫu đầy đủ nằm trong `.env.example`. Khi deploy, khai báo trong Vercel → Settings → Environment Variables rồi redeploy.

Bắt buộc trên bản deploy:

- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: Upstash Redis. Không có thì nền tảng từ chối lưu, không ghi ra ổ tạm.
- `PLATFORM_SECRET`: ít nhất 16 ký tự, ký cookie phiên.
- `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY`: bucket tương thích S3 cho ảnh và nhạc.
- `NEXT_PUBLIC_SITE_URL`: địa chỉ công khai, dùng cho ảnh chia sẻ link.

Nên có khi nhận tiền:

- `VNPAY_TMN_CODE`, `VNPAY_SECRET_KEY`, `VNPAY_PAY_URL`. Để trống `VNPAY_PAY_URL` thì code dùng sandbox `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`. Production phải trỏ cổng thật.
- `VNPAY_RETURN_URL` để trống thì đường về là địa chỉ trình duyệt cộng `/api/vnpay/return`. IPN khai trên cổng VNPAY: `https://your-domain.vercel.app/api/vnpay/ipn`.
- `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_NUMBER`, `PAYMENT_ACCOUNT_NAME` cho chuyển khoản. Quản trị xác nhận đơn chuyển khoản trong trang quản trị.

Tùy chọn: `PLATFORM_ADMIN_USERNAME` và `PLATFORM_ADMIN_PASSWORD` tạo một lần ở lần đăng nhập đầu. `FACEBOOK_APP_ID` và `FACEBOOK_APP_SECRET` bật nút Facebook. `RESEND_API_KEY` với `NOTIFY_FROM` gửi email khi khách xác nhận. `CONTACT_ZALO`, `CONTACT_PHONE`, `CONTACT_EMAIL`, `CONTACT_FACEBOOK` hiện trên `/lien-he`.

`NEXT_PUBLIC_FORMSPREE_ID` chỉ là lối dự phòng của thiệp gốc khi máy chưa có Redis. Thiệp trên nền tảng không dùng Formspree.

## Lưu trữ

Redis giữ tài khoản, thiệp, đơn, sổ lưu bút, xác nhận tham dự và khách mời. Khóa nền tảng nằm sau `REDIS_KEY_PREFIX` và tiền tố `platform:`, tách khỏi dữ liệu thiệp gốc.

Ảnh và nhạc tải trong xưởng không ghi byte vào Redis. Redis chỉ giữ mã file, chủ sở hữu và cờ đã công khai. Byte nằm trên object storage, đường dẫn `media/<mã>`. Ứng dụng vẫn phát file qua `/api/media/[id]` sau khi kiểm tra quyền xem.

Bucket dùng API S3 path-style. Cloudflare R2, AWS S3 và MinIO đều được. `OBJECT_STORAGE_ENDPOINT` là gốc tài khoản, không kèm tên bucket, ví dụ `https://<account>.r2.cloudflarestorage.com`. Region của R2 để `auto`.

Ảnh đã lưu trong Redis từ trước vẫn đọc được. Lần mở đầu, nếu bucket đã cấu hình, byte được copy sang bucket rồi xóa khỏi Redis.

## Đăng nhập

Phiên ký HMAC, httpOnly, 14 ngày. Lần đăng nhập sai chỉ đếm trên Redis: 8 lần trong 15 phút cho một địa chỉ IP. Redis lỗi thì từ chối đăng nhập, không đếm trong bộ nhớ của từng tiến trình. Máy dev chưa gắn Redis không áp giới hạn này.

## Thiệp gốc

Nội dung nằm trong `content/wedding.json`. Trang `/admin` chỉ chạy với `npm run dev` trên localhost, dùng để sửa tên, ngày, địa điểm, album và nhạc của thiệp gốc. Ảnh tải ở đó vẫn vào `public/gallery`, `public/qrcode`, `public/music`.

`/quan-ly` dùng `GUESTBOOK_ADMIN_PASSWORD`. Ba tab: xác nhận tham dự, khách mời, lời chúc. Link riêng của khách là `/thiep/tien-dat-huyen-trang?to=Tên`. Đường `/?to=` cũng chuyển về slug này.

Nhạc mẫu gắn với từng mẫu thiệp nằm trong `public/music`. Đó không phải file khách tải lên.

## Mẫu và màu

Danh sách mẫu ở `lib/platform/templates.ts`. Màu ở `lib/themes.ts` và các khối `[data-theme]` trong `app/globals.css`. Component dùng lớp `text-w-strong`, `bg-w-card`, `border-w-line` nên đổi theo theme.

## Deploy

1. Đẩy code lên GitHub.
2. Trên Vercel: Add New → Project → chọn repo → Deploy.
3. Gắn Upstash Redis (Storage → Upstash → Connect).
4. Tạo bucket R2 hoặc S3, khai báo bốn biến `OBJECT_STORAGE_*`.
5. Khai báo `PLATFORM_SECRET`, `NEXT_PUBLIC_SITE_URL`, cổng VNPAY production và các biến còn lại trong `.env.example`.
6. Redeploy.

`/api/health` báo `storage` là `redis` hoặc `thieu-redis`, và `media` là `object`, `file` hoặc `chua-gan`.
