import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories, categoryPath } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { BRAND, absoluteUrl } from "@lib/raks"
import {
  formatFromPrice,
  categoryTerm,
  isIndexableCategory,
  lowestPrice,
} from "@lib/util/category-seo"

type Props = {
  params: Promise<{ category: string[] }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()
  if (!product_categories) {
    return []
  }
  // Generate the full hierarchical path for each category
  return product_categories
    .filter((c: HttpTypes.StoreProductCategory) => c.handle)
    .map((c: HttpTypes.StoreProductCategory) => {
      const slugs: string[] = []
      let cur: any = c
      while (cur) {
        if (cur.handle) slugs.unshift(cur.handle)
        cur = cur.parent_category
      }
      return { category: slugs }
    })
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)
    if (!productCategory) notFound()

    const term = categoryTerm(productCategory)
    const meta = (productCategory.metadata ?? {}) as Record<string, string>
    const canonical = absoluteUrl(categoryPath(productCategory))

    // One fetch serves three purposes: the index decision for empty categories
    // (see isIndexableCategory), the style count and the starting price. Counted
    // rather than hardcoded so a category returns to the index by itself once
    // products are assigned to it.
    const {
      response: { count, products },
    } = await listProducts({
      countryCode: "pk",
      queryParams: {
        category_id: [productCategory.id],
        limit: 250,
        fields: "handle,*variants.calculated_price",
      } as HttpTypes.FindParams & HttpTypes.StoreProductListParams,
    })
    const fromPrice = lowestPrice(products)

    // Geo-intent title targeting the three top query patterns for this market:
    // "{X} online pakistan", "buy {X} online pakistan" and "{X} price in
    // pakistan". Prefer a migrated Yoast title when present.
    const title =
      meta.seo_title ||
      `Buy ${term} Online in Pakistan — Prices & Sizes | ${BRAND.name}`

    // Fact-packed meta description — the facts search and AI answer engines
    // extract. The real starting price leads, because "{X} price in pakistan"
    // is one of the largest query patterns in the data and the title has been
    // promising "Prices" without ever showing one.
    const priceLead =
      fromPrice !== null ? ` from ${formatFromPrice(fromPrice)}` : ""
    const styles = `${count} ${count === 1 ? "style" : "styles"}`
    const description =
      meta.seo_description ||
      `Shop ${term.toLowerCase()} online in Pakistan at ${
        BRAND.name
      } — ${styles}${priceLead}. All sizes, Cash on Delivery, free delivery over Rs 3,000 and discreet packaging.`

    return {
      title: { absolute: title },
      description,
      alternates: { canonical },
      ...(isIndexableCategory(count)
        ? {}
        : { robots: { index: false, follow: true } }),
      // No explicit `openGraph` here on purpose: defining it (even partially)
      // suppresses the file-convention opengraph-image banner. Next derives
      // og:title/description from the fields above and applies the banner.
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category)
  if (!productCategory) {
    notFound()
  }

  // Breadcrumb JSON-LD
  const crumbs: { name: string; url: string }[] = []
  let cur: any = productCategory
  const chain: any[] = []
  while (cur) {
    chain.unshift(cur)
    cur = cur.parent_category
  }
  const slugs: string[] = []
  for (const c of chain) {
    slugs.push(c.handle)
    crumbs.push({ name: c.name, url: absoluteUrl(`/product-category/${slugs.join("/")}/`) })
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        item: c.url,
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode="pk"
        canonical={absoluteUrl(categoryPath(productCategory))}
      />
    </>
  )
}
