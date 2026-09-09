import { getNavCategories } from "@modules/layout/templates/nav/nav-categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BRAND, SOCIAL_PROFILES, YEAR } from "@lib/raks"
import { landingPages } from "@lib/landing-pages"

export default async function Footer() {
  const categories = await getNavCategories()
  const year = YEAR

  return (
    <footer className="bg-ink text-[#cdb9a3] mt-auto">
      <div className="content-container grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-10 pt-16 pb-10">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-[18px]">
            <span className="font-arabic text-[56px] leading-none text-gold-light px-0.5 tracking-[0.02em]">
              رقـص
            </span>
            <span className="w-px h-[42px] bg-[#5a4338]" />
            <span className="font-display font-medium text-[26px] tracking-[0.32em] text-white pl-[0.32em]">
              RAKS
            </span>
          </div>
          <p className="mt-[18px] mb-6 text-[13.5px] leading-[1.7] font-light max-w-[280px] text-[#b09c86]">
            RAKS celebrates every body with lingerie that feels bold, freeing and
            unapologetically feminine. Designed in Pakistan, made for every mood and
            every curve.
          </p>
          {/* The owner's five official profiles, each checked before listing.
              These badges used to be plain spans that linked nowhere. */}
          <div className="flex gap-2.5">
            {SOCIAL_PROFILES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`RAKS on ${s.name}`}
                className="w-9 h-9 border border-[#5a4338] rounded-full flex items-center justify-center text-[11px] tracking-[0.04em] text-[#cdb9a3] hover:text-cream-50 hover:border-[#8a6b58] transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-bronze-300 mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <LocalizedClientLink href="/shop/" className="hover:text-cream-50 transition-colors">
                Shop All
              </LocalizedClientLink>
            </li>
            {categories.map((c) => (
              <li key={c.href}>
                <LocalizedClientLink href={c.href} className="hover:text-cream-50 transition-colors">
                  {c.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-bronze-300 mb-4">
            <LocalizedClientLink href="/collections/" className="hover:text-cream-50 transition-colors">
              Shop by Style
            </LocalizedClientLink>
          </h4>
          <ul className="space-y-2.5 text-sm">
            {landingPages.slice(0, 9).map((lp) => (
              <li key={lp.slug}>
                <LocalizedClientLink
                  href={`/collections/${lp.slug}/`}
                  className="hover:text-cream-50 transition-colors"
                >
                  {lp.heading}
                </LocalizedClientLink>
              </li>
            ))}
            <li>
              <LocalizedClientLink
                href="/collections/"
                className="text-bronze-300 hover:text-cream-50 transition-colors"
              >
                View all →
              </LocalizedClientLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-bronze-300 mb-4">Help</h4>
          <ul className="space-y-2.5 text-sm">
            <li><LocalizedClientLink href="/faqs/" className="hover:text-cream-50 transition-colors">FAQs</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/contact-us/" className="hover:text-cream-50 transition-colors">Contact Us</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/account" className="hover:text-cream-50 transition-colors">Track Order</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/terms-condition/" className="hover:text-cream-50 transition-colors">Terms &amp; Conditions</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/privacy-policy/" className="hover:text-cream-50 transition-colors">Privacy Policy</LocalizedClientLink></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-bronze-300 mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm">
            <li><LocalizedClientLink href="/about-us/" className="hover:text-cream-50 transition-colors">About Raks</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/blogs/" className="hover:text-cream-50 transition-colors">Journal</LocalizedClientLink></li>
            <li><LocalizedClientLink href="/contact-us/" className="hover:text-cream-50 transition-colors">Contact</LocalizedClientLink></li>
            <li><a href={BRAND.instagram} target="_blank" rel="noreferrer" className="hover:text-cream-50 transition-colors">Instagram</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#45302a]">
        <div className="content-container py-[22px] flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
          <span className="text-xs text-[#8f7c69]">
            © {year} {BRAND.name} · Designed in Pakistan · All rights reserved
          </span>
          {/* Cash on Delivery is the only method checkout can actually complete
              (see the `cod` provider in lib/data/cart.ts). The badges previously
              also advertised Easypaisa, JazzCash, Visa and Mastercard, none of
              which are wired up. Add them back as each one goes live. */}
          <div className="flex gap-2">
            <span className="text-[9.5px] tracking-[0.1em] border border-[#5a4338] text-[#b09c86] px-2.5 py-1.5 rounded-[3px]">
              CASH ON DELIVERY
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
