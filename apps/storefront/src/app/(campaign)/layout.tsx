import { Metadata } from "next"

import {
  BRAND,
  SITE_URL,
  YEAR,
  freeDeliveryThresholdLabel,
  whatsappUrl,
} from "@lib/raks"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
}

/**
 * The shell for paid-traffic landing pages.
 *
 * Deliberately not the (main) layout: no category navigation, no search, no
 * bag icon, no shopping assistant. Every one of those is a way to leave the
 * page, and a visitor from an ad has already been shown the one product they
 * came for. What stays is what builds trust — the wordmark, the store's
 * standing promises, and a way to ask a human.
 */
export default function CampaignLayout(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-[#fffdf9]">
        <div className="content-container flex h-[64px] items-center justify-between gap-4">
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-3 shrink-0"
            data-testid="store-link"
          >
            <span className="font-arabic text-[34px] leading-none text-accent px-0.5 tracking-[0.02em]">
              رقـص
            </span>
            <span className="w-px h-[30px] bg-[#e0cba6]" />
            <span className="flex flex-col items-start">
              <span className="font-display font-medium text-[18px] leading-[0.9] tracking-[0.36em] text-accent pl-[0.36em]">
                RAKS
              </span>
              <span className="text-[7px] tracking-[0.32em] uppercase text-gold-deep mt-[4px] pl-[0.32em]">
                Lingerie · Pakistan
              </span>
            </span>
          </LocalizedClientLink>

          <a
            href={whatsappUrl("Hi Raks, I have a question about the bridal silk 5-piece set.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border border-[#d8c6ae] px-3.5 py-2 text-[11.5px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c.6.3 1.1.4 1.5.6.6.2 1.2.2 1.7.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </header>

      {/* The store's standing promises, from POLICY, so this strip cannot
          disagree with the FAQ or the checkout. */}
      <div className="bg-ink px-4 py-[9px] text-center text-[11px] uppercase tracking-[0.14em] text-[#f3e7d3]">
        Cash on Delivery &nbsp;·&nbsp; Free delivery over{" "}
        {freeDeliveryThresholdLabel()} &nbsp;·&nbsp; Plain packaging
      </div>

      {props.children}

      <footer className="border-t border-cream-300 bg-[#fffdf9]">
        <div className="content-container flex flex-col items-center gap-3 py-8 text-center text-[12px] text-ink/55 small:flex-row small:justify-between small:text-left">
          <p>
            © {YEAR} {BRAND.name} · Lahore, Pakistan ·{" "}
            <a
              href={`mailto:${BRAND.email}`}
              className="underline underline-offset-2 hover:text-accent"
            >
              {BRAND.email}
            </a>
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            <LocalizedClientLink
              href="/terms-condition/"
              className="hover:text-accent"
            >
              Terms
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/privacy-policy/"
              className="hover:text-accent"
            >
              Privacy
            </LocalizedClientLink>
            <LocalizedClientLink href="/contact-us/" className="hover:text-accent">
              Contact
            </LocalizedClientLink>
            <LocalizedClientLink href="/" className="hover:text-accent">
              Full store
            </LocalizedClientLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}
