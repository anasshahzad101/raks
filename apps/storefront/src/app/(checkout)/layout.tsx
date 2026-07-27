import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full relative small:min-h-screen bg-cream">
      <div className="h-[70px] border-b border-cream-300 bg-[#fffdf9]">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart/"
            className="flex flex-1 basis-0 items-center gap-x-1.5 text-[12px] uppercase tracking-[0.14em] text-ink/60 transition-colors hover:text-accent"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block">Back to bag</span>
            <span className="mt-px block small:hidden">Back</span>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/"
            className="flex items-center gap-2.5"
            data-testid="store-link"
          >
            <span className="font-arabic text-[30px] leading-none text-accent">
              رقـص
            </span>
            <span className="hidden small:block h-6 w-px bg-[#e0cba6]" />
            <span className="hidden small:block font-display text-[17px] font-medium tracking-[0.32em] text-accent pl-[0.32em]">
              RAKS
            </span>
          </LocalizedClientLink>

          <div className="flex flex-1 basis-0 items-center justify-end gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink/45">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="4" y="10" width="16" height="10" rx="1.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <span className="hidden small:inline">Secure checkout</span>
          </div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
