import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import { listProductsWithSort } from "@lib/data/products"
import { CATEGORY_PRODUCT_FIELDS } from "@lib/util/product-fields"
import { categoryPath } from "@lib/data/categories"
import SortDropdown from "@modules/store/components/refinement-list/sort-dropdown"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryNav from "@modules/categories/components/category-nav"
import CategoryBrowser from "@modules/categories/components/category-browser"
import CategoryInfo from "@modules/categories/components/category-info"
import { getCategoryFaqs } from "@lib/faqs"
import { parseCategoryContent } from "@lib/util/category-content"
import { HttpTypes } from "@medusajs/types"

export default async function CategoryTemplate({
  category,
  sortBy,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
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
  const faqs = descFaqs.length ? descFaqs : getCategoryFaqs(category.name)

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

  return (
    <div className="content-container py-8 small:py-12">
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
            {category.name}
          </h1>
          <p className="mt-2 text-[13px] tracking-[0.04em] text-ink/50">
            {count} {count === 1 ? "product" : "products"}
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
        products={products}
        region={region ?? undefined}
        categoryNav={<CategoryNav activeCategory={category} />}
      />

      {/* About the collection + FAQs — two-column, matches the reference */}
      <CategoryInfo
        heading={`Buy ${category.name} online in Pakistan`}
        description={aboutBody}
        faqs={faqs}
      />
    </div>
  )
}
