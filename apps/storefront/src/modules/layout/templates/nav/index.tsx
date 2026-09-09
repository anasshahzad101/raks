import { Suspense } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { getNavCategories } from "./nav-categories"
import MobileMenu from "./mobile-menu"

function Wordmark() {
  return (
    <LocalizedClientLink
      href="/"
      data-testid="nav-store-link"
      className="flex items-center gap-3 sm:gap-[18px] shrink-0"
    >
      <span className="font-arabic text-[40px] sm:text-[52px] leading-none text-accent px-0.5 tracking-[0.02em]">
        رقـص
      </span>
      <span className="hidden sm:block w-px h-[42px] bg-[#e0cba6]" />
      <span className="hidden sm:flex flex-col items-start">
        <span className="font-display font-medium text-[23px] leading-[0.9] tracking-[0.36em] text-accent pl-[0.36em]">
          RAKS
        </span>
        <span className="text-[7.5px] tracking-[0.32em] uppercase text-gold-deep mt-[5px] pl-[0.32em]">
          Lingerie · Pakistan
        </span>
      </span>
    </LocalizedClientLink>
  )
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center text-ink/80 hover:text-accent transition-colors">
      {children}
    </span>
  )
}

export default async function Nav() {
  const categories = await getNavCategories()

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      {/* Announcement bar */}
      <div className="bg-ink text-[#f3e7d3] text-center text-[11.5px] tracking-[0.16em] uppercase py-[9px] px-4">
        Get extra 20% off &nbsp;·&nbsp; use code{" "}
        <span className="text-gold-light font-semibold">COMBO20</span> &nbsp;·&nbsp;
        free discreet delivery over Rs 3,000
      </div>

      <header className="bg-[#fffdf9] border-b border-cream-200">
        <div className="content-container flex items-center gap-5 lg:gap-[30px] h-[78px] lg:h-[94px]">
          {/* Left: mobile menu + wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <MobileMenu categories={categories} />
            <Wordmark />
          </div>

          {/* Center: nav */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-5 flex-nowrap">
            <LocalizedClientLink
              href="/shop/"
              className="text-[11.5px] font-medium tracking-[0.1em] uppercase whitespace-nowrap text-ink/85 hover:text-accent transition-colors"
            >
              Shop All
            </LocalizedClientLink>
            {categories.map((c) => (
              <div key={c.href} className="relative group/cat flex items-center h-[94px]">
                <LocalizedClientLink
                  href={c.href}
                  className="text-[11.5px] font-medium tracking-[0.1em] uppercase whitespace-nowrap text-ink/85 hover:text-accent transition-colors"
                >
                  {c.name}
                </LocalizedClientLink>
                {c.children.length > 0 && (
                  <div className="invisible opacity-0 group-hover/cat:visible group-hover/cat:opacity-100 transition-all absolute top-full left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-[#fffdf9] border border-cream-200 shadow-xl py-2 min-w-[190px]">
                      {c.children.map((ch) => (
                        <LocalizedClientLink
                          key={ch.href}
                          href={ch.href}
                          className="block px-5 py-2 text-[12.5px] text-ink/75 hover:text-accent hover:bg-cream-100 transition-colors"
                        >
                          {ch.name}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <LocalizedClientLink
              href="/blogs/"
              className="text-[11.5px] font-medium tracking-[0.1em] uppercase whitespace-nowrap text-ink/85 hover:text-accent transition-colors"
            >
              Journal
            </LocalizedClientLink>
          </nav>

          {/* Right: icons */}
          <div className="flex items-center gap-4 sm:gap-[18px] shrink-0 ml-auto lg:ml-0">
            <LocalizedClientLink href="/shop/" aria-label="Search" className="hidden sm:flex">
              <Icon>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
              </Icon>
            </LocalizedClientLink>
            <LocalizedClientLink href="/account" aria-label="Account" data-testid="nav-account-link">
              <Icon>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
                </svg>
              </Icon>
            </LocalizedClientLink>
            <LocalizedClientLink href="/wishlist/" aria-label="Favourites" className="hidden sm:flex">
              <Icon>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M12 21s-7-4.6-9.3-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.3 6.5C19 16.4 12 21 12 21z" strokeLinejoin="round" />
                </svg>
              </Icon>
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink href="/cart" data-testid="nav-cart-link" aria-label="Bag">
                  <Icon>
                    <BagIcon />
                  </Icon>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  )
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  )
}
