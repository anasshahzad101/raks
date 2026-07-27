import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LandingPage } from "@lib/landing-pages"

/**
 * "Shop the Collection" block shown at the end of a blog post — contextual
 * internal links from editorial content to commercial collection pages.
 */
const BlogCollectionsCta = ({
  collections,
}: {
  collections: LandingPage[]
}) => {
  if (!collections.length) {
    return null
  }

  return (
    <div className="content-container max-w-3xl mt-14">
      <div className="rounded-large border border-bronze-100 bg-cream/40 p-6 small:p-8">
        <h2 className="font-display text-2xl text-ink">Shop the Collection</h2>
        <p className="mt-1 mb-5 text-sm text-ink/60">
          Explore the styles featured in this guide.
        </p>
        <div className="grid grid-cols-1 gap-3 small:grid-cols-3">
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
      </div>
    </div>
  )
}

export default BlogCollectionsCta
