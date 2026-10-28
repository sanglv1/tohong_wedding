/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Bộ nhớ đệm ảnh chỉ dựa vào đường dẫn: khi dev, chép đè ảnh trùng tên sẽ hiện ảnh mới sau tối đa 60 giây
    ...(process.env.NODE_ENV === 'development' && { minimumCacheTTL: 60 }),
  },
  // Trang cũ gộp vào /quan-ly
  async redirects() {
    return [
      { source: '/quan-ly-loi-chuc', destination: '/quan-ly?tab=loi-chuc', permanent: false },
      { source: '/tao-link', destination: '/quan-ly?tab=khach-moi', permanent: false },
      { source: '/tao-thiep', destination: '/', permanent: false },
      { source: '/', has: [{ type: 'query', key: 'to' }], destination: '/thiep/tien-dat-huyen-trang', permanent: false },
    ]
  },
}

export default nextConfig
