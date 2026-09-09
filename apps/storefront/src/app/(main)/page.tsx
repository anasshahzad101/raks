import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import CategoryShowcase from "@modules/home/components/category-showcase"
import FeaturedRail from "@modules/home/components/featured-rail"
import JournalTeasers from "@modules/home/components/journal-teasers"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BRAND, SITE_URL, SEO_DEFAULT_TITLE, ORG_ID } from "@lib/raks"

export const metadata: Metadata = {
  title: { absolute: SEO_DEFAULT_TITLE },
  description: BRAND.description,
  alternates: { canonical: SITE_URL },
}

// No SearchAction. It declared `/shop/?q={search_term_string}` as a site search,
// but `q` is not read anywhere: /shop/?q=bra returns exactly the same products as
// /shop/. Advertising a sitelinks searchbox that silently ignores the query sends
// searchers to an unfiltered list. Restore this once real search is implemented.
const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: BRAND.name,
  url: SITE_URL,
  inLanguage: "en-PK",
  publisher: { "@id": ORG_ID },
}

const OFFERS = [
  {
    kicker: "Save 20%",
    title: "The Combo Edit — mix & match sets",
    cta: "Shop combos",
    href: "/shop/",
    bg: "#efe2cf",
    border: "#e2d2bb",
    fg: "#2a1117",
    accent: "#9a6f34",
  },
  {
    kicker: "New In",
    title: "Bridal Room — for your softest moments",
    cta: "Explore bridal",
    href: "/collections/bridal/",
    bg: "linear-gradient(115deg,#4a0e1f,#6d1430)",
    border: "#4a0e1f",
    fg: "#ffffff",
    accent: "#e3b65c",
  },
  {
    kicker: "Everyday",
    title: "Comfort basics from Rs 990",
    cta: "Shop basics",
    href: "/shop/",
    bg: "#fffdf9",
    border: "#ece0cf",
    fg: "#2a1117",
    accent: "#9a6f34",
  },
]

function OfferCards() {
  return (
    <section className="content-container pt-[70px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {OFFERS.map((o) => (
          <LocalizedClientLink
            key={o.title}
            href={o.href}
            className="group flex flex-col gap-2.5 px-[30px] py-[34px] border transition-transform duration-300 hover:-translate-y-1"
            style={{ background: o.bg, borderColor: o.border }}
          >
            <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: o.accent }}>
              {o.kicker}
            </span>
            <span className="font-display text-[27px] leading-[1.12]" style={{ color: o.fg }}>
              {o.title}
            </span>
            <span
              className="text-[12.5px] tracking-[0.14em] uppercase mt-1.5 self-start border-b pb-[3px]"
              style={{ color: o.fg, borderColor: "currentColor" }}
            >
              {o.cta} →
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: "🚚",
    title: "Discreet delivery",
    text: "Plain, unbranded packaging delivered fast across Pakistan.",
  },
  {
    icon: "↺",
    title: "Easy exchanges",
    text: "Wrong fit? Swap sizes within 15 days, hassle-free.",
  },
  {
    icon: "✦",
    title: "Fabric listed per product",
    text: "Every product page lists its own fabric and available sizes.",
  },
  {
    icon: "♥",
    title: "Cash on Delivery",
    text: "Pay when your order arrives, anywhere in Pakistan.",
  },
]

function FeaturesBand() {
  return (
    <section className="mt-[90px] bg-cream-200 border-y border-cream-300">
      <div className="content-container grid grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-[30px] py-[54px]">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center gap-3.5">
            <div className="w-[46px] h-[46px] text-accent flex items-center justify-center text-2xl">
              {f.icon}
            </div>
            <div className="font-display text-xl text-ink">{f.title}</div>
            <div className="text-[13px] leading-[1.6] text-[#6b5a4d] font-light max-w-[220px]">
              {f.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Newsletter() {
  return (
    <section className="mt-[90px] relative overflow-hidden bg-[linear-gradient(115deg,#4a0e1f,#6d1430)]">
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_20%_0%,rgba(187,138,69,0.22),transparent_55%)]" />
      <div className="max-w-[760px] mx-auto px-10 py-[74px] text-center relative">
        <div className="text-xs tracking-[0.3em] uppercase text-gold-light mb-[18px]">
          Join the RAKS list
        </div>
        <h2 className="font-display font-medium text-[34px] sm:text-[40px] text-white m-0 mb-4">
          First to know, first to wear
        </h2>
        <p className="text-[15px] text-white/[0.78] font-light mb-8">
          Exclusive offers, new arrivals and fit tips — straight to your inbox.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto">
          <input
            type="email"
            required
            placeholder="Your email address"
            className="flex-1 bg-white/10 border border-white/30 text-white placeholder:text-white/50 px-5 py-[15px] text-sm focus:outline-none focus:border-gold-light"
          />
          <button
            type="submit"
            className="bg-[#fffdf9] text-accent text-xs font-semibold tracking-[0.16em] uppercase px-7 py-4 hover:bg-gold-light transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <Hero />
      <CategoryShowcase />
      <OfferCards />
      <FeaturedRail title="Bestsellers" eyebrow="Loved by Pakistan" order="-created_at" />
      <FeaturesBand />
      <JournalTeasers />
      <Newsletter />
    </>
  )
}
