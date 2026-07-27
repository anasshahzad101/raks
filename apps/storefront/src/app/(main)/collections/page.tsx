import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { landingPages } from "@lib/landing-pages"
import { BRAND, absoluteUrl } from "@lib/raks"

export const metadata: Metadata = {
  title: { absolute: `Shop by Style — Lingerie & Nightwear Collections | ${BRAND.name}` },
  description:
    "Browse Raks collections by style, fabric and occasion — silk, lace, net and cotton nighties, bridal & honeymoon nightwear, robes, pyjamas, shapewear and more. Cash on Delivery across Pakistan.",
  alternates: { canonical: absoluteUrl("/collections/") },
}

export default function CollectionsIndexPage() {
  return (
    <div className="content-container py-10 small:py-16">
      <div className="mb-10 flex flex-col gap-y-3">
        <nav className="text-xs uppercase tracking-luxe text-ink/50">Shop</nav>
        <h1 className="font-display text-4xl text-ink small:text-5xl">
          Shop by Style
        </h1>
        <p className="max-w-2xl text-ink/60">
          Explore our lingerie and nightwear collections by fabric, style and
          occasion — handpicked to make finding your perfect piece effortless.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-x-8 gap-y-4 small:grid-cols-2 medium:grid-cols-3">
        {landingPages.map((lp) => (
          <li key={lp.slug}>
            <LocalizedClientLink
              href={`/collections/${lp.slug}/`}
              className="group flex flex-col border-b border-bronze-100 py-3 transition-colors hover:border-ink"
            >
              <span className="font-display text-xl text-ink group-hover:text-bronze-600">
                {lp.heading}
              </span>
              <span className="mt-0.5 text-sm text-ink/55 line-clamp-1">
                {lp.description.split(".")[0]}.
              </span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
