import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import { listProductsWithSort } from "@lib/data/products"
import { toGaItems } from "@lib/analytics"
import { ViewItemList } from "@modules/analytics/ecommerce-events"
import { CATEGORY_PRODUCT_FIELDS } from "@lib/util/product-fields"
import { categoryPath } from "@lib/data/categories"
import SortDropdown from "@modules/store/components/refinement-list/sort-dropdown"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryNav from "@modules/categories/components/category-nav"
import CategoryBrowser from "@modules/categories/components/category-browser"
import { slimProductForCard, buildSizeLookup } from "@lib/util/slim-product"
import CategoryInfo from "@modules/categories/components/category-info"
import { getCategoryFaqs } from "@lib/faqs"
import { getCollectionsForCategory, landingH1 } from "@lib/landing-pages"
import { parseCategoryContent } from "@lib/util/category-content"
import {
  categoryAboutHeading,
  categoryH1,
  categoryItemListLd,
  formatFromPrice,
  lowestPrice,
} from "@lib/util/category-seo"
import { getCategoryCopy } from "@lib/category-copy"
import { HttpTypes } from "@medusajs/types"

export default async function CategoryTemplate({
  category,
  sortBy,
  countryCode,
  canonical,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  canonical: string
}) {
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const region = await getRegion(countryCode)

  // Parent chain for the breadcrumb.
  const parents: HttpTypes.StoreProductCategory[] = []
  const collectParents = (c: HttpTypes.StoreProductCategory) => {
    if (c.parent_category) {
      parents.push(c.parent_category)
      collectParents(c.parent_category)
    }
  }
  collectParents(category)
  const orderedParents = [...parents].reverse()

  // Split the migrated description into clean prose + the FAQ block embedded at
  // its end. Show the real extracted FAQs when present; otherwise fall back to
  // the generic per-category FAQs.
  const { body: aboutBody, faqs: descFaqs } = parseCategoryContent(
    category.description
  )
  // Categories the migration left without copy fall back to hand-written text
  // before the templated shipping FAQs, which carry no topical information.
  const copy = getCategoryCopy(category.handle)
  const body = aboutBody || copy?.description
  const faqs = descFaqs.length
    ? descFaqs
    : copy?.faqs ?? getCategoryFaqs(category.name)

  // Load the category's products sorted, then filter sizes on the client. The
  // limit must exceed the largest category (nightwear, 123) or the header count
  // contradicts the grid — it read "123 products" while rendering only 100.
  const {
    response: { products, count },
  } = await listProductsWithSort({
    page: 1,
    queryParams: {
      category_id: [category.id],
      limit: 250,
      fields: CATEGORY_PRODUCT_FIELDS,
    } as HttpTypes.FindParams & HttpTypes.StoreProductParams,
    sortBy: sort,
    countryCode,
  })

  // Tells Google the grid is a product listing. The page already emitted
  // Breadcrumb, Organization and FAQPage, but nothing describing the products
  // themselves — the one thing a category page exists to show.
  const itemListLd = categoryItemListLd(category, products, canonical)

  // The /collections/ landing pages that sit under this category. They target
  // the style and occasion queries a single category page cannot rank for, and
  // until now nothing on the site linked to them except blog footers.
  const collections = getCollectionsForCategory(category.handle ?? "")

  const fromPrice = lowestPrice(products)

  return (
    <div className="content-container py-8 small:py-12">
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}
      <ViewItemList
        items={toGaItems(products)}
        listId={`category_${category.handle}`}
        listName={category.name}
      />
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-x-2 text-xs tracking-[0.05em] text-ink/55">
        <LocalizedClientLink href="/" className="transition-colors hover:text-accent">
          Home
        </LocalizedClientLink>
        {orderedParents.map((parent) => (
          <span key={parent.id} className="flex items-center gap-x-2">
            <span>/</span>
            <LocalizedClientLink
              href={categoryPath(parent)}
              className="transition-colors hover:text-accent"
            >
              {parent.name}
            </LocalizedClientLink>
          </span>
        ))}
        <span>/</span>
        <span className="text-ink">{category.name}</span>
      </nav>

      {/* Header + sort */}
      <div
        className="mb-9 flex flex-wrap items-end justify-between gap-4 border-b border-cream-300 pb-6"
        data-testid="category-container"
      >
        <div className="max-w-2xl">
          <h1
            className="m-0 font-display text-[40px] font-medium leading-none text-ink small:text-[46px]"
            data-testid="category-page-title"
          >
            {categoryH1(category)}
          </h1>
          <p className="mt-2 text-[13px] tracking-[0.04em] text-ink/50">
            {count} {count === 1 ? "style" : "styles"}
            {fromPrice !== null && (
              <> &middot; from {formatFromPrice(fromPrice)}</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-[11px] uppercase tracking-[0.16em] text-ink/55 small:inline">
            Sort
          </span>
          <SortDropdown sortBy={sort} data-testid="sort-by-container" />
        </div>
      </div>

      {/* Filter sidebar + product grid */}
      <CategoryBrowser
        products={products.map(slimProductForCard)}
        sizesByProduct={buildSizeLookup(products)}
        region={region ?? undefined}
        categoryNav={<CategoryNav activeCategory={category} />}
      />

      {/* Shop by style — internal links to the long-tail landing pages */}
      {collections.length > 0 && (
        <section className="mt-16 border-t border-cream-300 pt-12 small:mt-20 small:pt-[52px]">
          <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold">
            Shop by style
          </div>
          <h2 className="mb-6 font-display text-[28px] font-medium leading-[1.15] text-ink small:text-[34px]">
            Browse {category.name.toLowerCase()} by style and occasion
          </h2>
          <div className="grid grid-cols-2 gap-3 small:grid-cols-4">
            {collections.map((c) => (
              <LocalizedClientLink
                key={c.slug}
                href={`/collections/${c.slug}/`}
                className="group flex items-center justify-between gap-2 border border-cream-300 bg-cream-50 px-4 py-3 transition-colors hover:border-ink"
              >
                <span className="text-[13px] font-medium leading-tight text-ink">
                  {landingH1(c)}
                </span>
                <span className="shrink-0 text-gold transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </section>
      )}

      {/* About the collection + FAQs — two-column, matches the reference */}
      <CategoryInfo
        heading={categoryAboutHeading(category)}
        description={body}
        faqs={faqs}
      />
    </div>
  )
}
