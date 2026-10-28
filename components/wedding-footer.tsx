export function WeddingFooter({ platformLink = false }: { platformLink?: boolean }) {
  return (
    <footer className="relative z-[1] py-16 sm:py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center py-12">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-6 text-w-strong">Thank You</h2>
        <p className="text-base sm:text-lg italic max-w-lg mx-auto mb-12 text-w-soft">
          &ldquo;Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!&rdquo;
        </p>
        {platformLink && (
          <p className="mb-4 text-sm">
            <a href="/" className="text-w-muted underline decoration-w-line underline-offset-4">
              Tạo thiệp trên Tơ Hồng
            </a>
          </p>
        )}
        <p className="text-sm text-w-muted opacity-80">© 2026 Design by SangLV</p>
      </div>
    </footer>
  )
}
