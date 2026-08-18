import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LandingPage } from "@lib/landing-pages"

export type CategoryLink = { name: string; href: string }

/**
 * "Shop the Collection" block shown at the end of a blog post — contextual
 * internal links from editorial content to commercial pages.
 *
 * Categories come first and are styled as the primary action: they are the
 * pages that need the authority (average position 13.7 against the Journal's
 * 8.0), and they are what a reader finishing a buying guide actually wants.
 */
const BlogCollectionsCta = ({
  categories = [],
  collections,
}: {
  categories?: CategoryLink[]
  collections: LandingPage[]
}) => {
  if (!categories.length && !collections.length) {
    return null
  }

  return (
    <div className="content-container max-w-3xl mt-14">
      <div className="rounded-large border border-bronze-100 bg-cream/40 p-6 small:p-8">
        <h2 className="font-display text-2xl text-ink">Shop the Collection</h2>
        <p className="mt-1 mb-5 text-sm text-ink/60">
          Explore the styles featured in this guide.
        </p>

        {categories.length > 0 && (
          <div className="grid grid-cols-1 gap-3 small:grid-cols-3">
            {categories.map((c) => (
              <LocalizedClientLink
                key={c.href}
                href={c.href}
                className="group flex items-center justify-between gap-2 rounded-rounded border border-ink bg-ink px-4 py-3 transition-colors hover:bg-accent hover:border-accent"
              >
                <span className="text-sm font-medium text-cream-50">{c.name}</span>
                <span className="text-cream-50/70 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        )}

        {collections.length > 0 && (
          <div
            className={`grid grid-cols-1 gap-3 small:grid-cols-3 ${
              categories.length ? "mt-3" : ""
            }`}
          >
            {collections.map((c) => (
              <LocalizedClientLink
                key={c.slug}
                href={`/collections/${c.slug}/`}
                className="group flex items-center justify-between gap-2 rounded-rounded border border-bronze-200 bg-white px-4 py-3 transition-colors hover:border-ink"
              >
                <span className="text-sm font-medium text-ink">{c.heading}</span>
                <span className="text-bronze-500 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogCollectionsCta
