/**
 * Category-page SEO helpers.
 *
 * Search Console (28 days to 2026-08-16) showed category pages ranking about
 * six positions worse than blog posts on the same site — 13.7 average vs 8.0 —
 * with /product-category/lingerie/bras/ at 12.98 while the blog post
 * /affordable-bra-brands-in-pakistan/ sat at 8.9 for the same intent. The
 * category H1s were bare nouns ("Bras") matching none of the geo-modified
 * queries actually driving impressions ("bra brands in pakistan", "bra in
 * pakistan", "best bra in pakistan with price").
 */
import { HttpTypes } from "@medusajs/types"
import { absoluteUrl, productUrl } from "@lib/raks"

/**
 * Head terms that outdraw the Medusa category name in Pakistani search, keyed
 * by handle. Taken from the GSC query mix rather than invented: "nighty" and
 * "night dress" carry the nightwear demand (194 queries) while the category is
 * named "Nightdress", and shoppers search "shapewear" more than "body shaper".
 */
const H1_OVERRIDES: Record<string, string> = {
  nightwear: "Nighty & Night Dress",
  pyjama: "Pyjama Sets & Night Suits",
  shapewear: "Body Shaper & Shapewear",
  panties: "Panties & Underwear",
  "nursing-and-maternity-bras": "Nursing & Maternity Bras",
  "non-padded-bra": "Non-Padded Bra",
  "luxury-nightwear": "Luxury Nightwear",
  "fabric-based-night-dress": "Fabric-Based Night Dress",
}

/**
 * Visible H1 for a category page: "{head term} in Pakistan". Names that already
 * carry the market ("Fancy Bra in Pakistan") are left alone so the heading does
 * not read "... in Pakistan in Pakistan".
 */
export function categoryH1(
  category: Pick<HttpTypes.StoreProductCategory, "name" | "handle">
): string {
  const term = H1_OVERRIDES[category.handle ?? ""] ?? category.name ?? ""
  return /pakistan/i.test(term) ? term : `${term} in Pakistan`
}

/**
 * The secondary heading over the long-form description. Kept distinct from the
 * H1 so the page does not repeat one phrase twice at heading level.
 */
export function categoryAboutHeading(
  category: Pick<HttpTypes.StoreProductCategory, "name" | "handle">
): string {
  const term = H1_OVERRIDES[category.handle ?? ""] ?? category.name ?? ""
  return `About our ${term.toLowerCase()} collection`
}

/**
 * A category with no products is an empty page: nothing to rank, nothing to
 * click. GSC had /product-category/lingerie/bras/bralette/ at average position
 * 53.4 — indexed, crawled and worthless, and three such pages drag on sitewide
 * quality. Kept crawlable (follow) so link equity still flows to the siblings
 * in the nav, and it self-heals the moment products are assigned.
 */
export function isIndexableCategory(productCount: number): boolean {
  return productCount > 0
}

/** Cap on products described in ItemList — enough for the carousel, not so many
 * that a 123-product category doubles its HTML weight. */
const ITEM_LIST_LIMIT = 30

/**
 * ItemList JSON-LD for the product grid. Category pages previously emitted
 * Breadcrumb, Organization and FAQPage but nothing identifying the grid itself
 * as a product listing, so Google had no structured signal for the one thing
 * the page is actually for.
 */
export function categoryItemListLd(
  category: Pick<HttpTypes.StoreProductCategory, "name" | "handle">,
  products: HttpTypes.StoreProduct[],
  canonical: string
) {
  return productItemListLd(categoryH1(category), products, canonical)
}

/** ItemList JSON-LD for any product grid — category pages and the
 * /collections/ landing pages both render one. */
export function productItemListLd(
  name: string,
  products: HttpTypes.StoreProduct[],
  canonical: string
) {
  const items = products
    .filter((p) => p.handle)
    .slice(0, ITEM_LIST_LIMIT)
    .map((product, i) => {
      const image = product.thumbnail || product.images?.[0]?.url
      return {
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(productUrl(product.handle!)),
        name: product.title,
        ...(image ? { image } : {}),
      }
    })

  if (!items.length) return null

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: canonical,
    numberOfItems: items.length,
    itemListElement: items,
  }
}
