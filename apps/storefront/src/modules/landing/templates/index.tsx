import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { getCategoryByHandle, categoryPath } from "@lib/data/categories"
import ProductPreview from "@modules/products/components/product-preview"
import FaqSection from "@modules/common/components/faq-section"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCategoryFaqs } from "@lib/faqs"
import { LandingPage, landingH1, getLandingPage } from "@lib/landing-pages"
import { categoryH1, productItemListLd } from "@lib/util/category-seo"
import { absoluteUrl } from "@lib/raks"

/**
 * A /collections/ landing page.
 *
 * These pages carried about 200 words each against the category pages' ~2,000,
 * a bare H1, no ItemList schema and no outbound links — and correspondingly no
 * rankings (3 of 26 had any impressions at all in a 28-day window). The
 * template now renders the market in the H1, the long-form buying guide, the
 * product listing as structured data, and real links out to the parent
 * category and sibling collections so the page is not a crawl dead end.
 */
export default async function LandingTemplate({ page }: { page: LandingPage }) {
  const region = await getRegion("pk")

  // Optionally scope the keyword search to a category (e.g. "cotton" within
  // Bras) so results stay precise.
  let categoryId: string | undefined
  if (page.categoryHandle) {
    const cat = await getCategoryByHandle([page.categoryHandle]).catch(() => null)
    categoryId = cat?.id
  }

  const { response } = await listProducts({
    countryCode: "pk",
    queryParams: {
      q: page.query,
      limit: 24,
      ...(categoryId ? { category_id: [categoryId] } : {}),
    } as any,
  })
  const products = response.products

  const canonical = absoluteUrl(`/collections/${page.slug}/`)
  const heading = landingH1(page)
  const itemListLd = productItemListLd(heading, products, canonical)

  // Parent category link — resolved live so a renamed category drops the link
  // rather than shipping a 404.
  const parent = page.parentCategory
    ? await getCategoryByHandle([page.parentCategory]).catch(() => null)
    : null

  const siblings = (page.related ?? [])
    .map((slug) => getLandingPage(slug))
    .filter((p): p is LandingPage => !!p)

  return (
    <div className="content-container py-6 small:py-10">
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}

      {/* Header: breadcrumb + title + intro */}
      <div className="mb-8 flex flex-col gap-y-3">
        <nav className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-luxe text-ink/50">
          <LocalizedClientLink href="/" className="hover:text-ink">
            Home
          </LocalizedClientLink>
          <span>/</span>
          {parent ? (
            <>
              <LocalizedClientLink
                href={categoryPath(parent)}
                className="hover:text-ink"
              >
                {parent.name}
              </LocalizedClientLink>
              <span>/</span>
            </>
          ) : (
            <>
              <LocalizedClientLink href="/shop/" className="hover:text-ink">
                Shop
              </LocalizedClientLink>
              <span>/</span>
            </>
          )}
          <span className="text-ink/70">{page.heading}</span>
        </nav>
        <h1 className="font-display text-4xl text-ink small:text-5xl">
          {heading}
        </h1>
        {products.length > 0 && (
          <p className="text-[13px] tracking-[0.04em] text-ink/50">
            {products.length}{" "}
            {products.length === 1 ? "style" : "styles"} available
          </p>
        )}
        <p className="max-w-3xl leading-relaxed text-ink/70">{page.intro}</p>
      </div>

      {/* Product grid */}
      <div className="border-t border-bronze-100 pt-8">
        {products.length && region ? (
          <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4">
            {products.map((p) => (
              <li key={p.id}>
                <ProductPreview product={p} region={region} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/60">
            No matching products right now.{" "}
            <LocalizedClientLink href="/shop/" className="text-bronze-600 underline">
              Browse all products
            </LocalizedClientLink>
            .
          </p>
        )}
      </div>

      {/* Long-form buying guide */}
      {page.body?.length ? (
        <div className="mt-16 max-w-3xl small:mt-20">
          {page.body.map((section) => (
            <section key={section.heading} className="mb-10 last:mb-0">
              <h2 className="mb-4 font-display text-2xl text-ink small:text-3xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((text, i) => (
                <p key={i} className="mb-4 leading-relaxed text-ink/70 last:mb-0">
                  {text}
                </p>
              ))}
            </section>
          ))}
        </div>
      ) : null}

      {/* FAQs + FAQPage schema. Page-specific Q&As where they exist; the
          templated category set is near-identical across collections. */}
      <FaqSection
        faqs={page.faqs?.length ? page.faqs : getCategoryFaqs(page.heading)}
        title={`${heading} — Frequently Asked Questions`}
        className="mt-16 small:mt-20 max-w-3xl"
      />

      {/* Outbound links: parent category + sibling collections */}
      {(parent || siblings.length > 0) && (
        <section className="mt-16 border-t border-bronze-100 pt-10 small:mt-20">
          <h2 className="mb-5 font-display text-2xl text-ink">Keep browsing</h2>
          <div className="grid grid-cols-1 gap-3 small:grid-cols-3">
            {parent && (
              <LocalizedClientLink
                href={categoryPath(parent)}
                className="group flex items-center justify-between gap-2 rounded-rounded border border-ink bg-ink px-4 py-3 transition-colors hover:border-accent hover:bg-accent"
              >
                <span className="text-sm font-medium text-cream-50">
                  All {categoryH1(parent)}
                </span>
                <span className="text-cream-50/70 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </LocalizedClientLink>
            )}
            {siblings.map((s) => (
              <LocalizedClientLink
                key={s.slug}
                href={`/collections/${s.slug}/`}
                className="group flex items-center justify-between gap-2 rounded-rounded border border-bronze-200 bg-white px-4 py-3 transition-colors hover:border-ink"
              >
                <span className="text-sm font-medium text-ink">{s.heading}</span>
                <span className="text-bronze-500 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
