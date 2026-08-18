import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories, categoryPath } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { BRAND, absoluteUrl } from "@lib/raks"
import { isIndexableCategory } from "@lib/util/category-seo"

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

    const name = productCategory.name
    const meta = (productCategory.metadata ?? {}) as Record<string, string>
    // Geo-intent title targeting the three top query patterns for this market:
    // "{X} online pakistan", "buy {X} online pakistan" and "{X} price in
    // pakistan". Prefer a migrated Yoast title when present.
    const title =
      meta.seo_title ||
      `Buy ${name} Online in Pakistan — Prices & Sizes | ${BRAND.name}`
    // Fact-packed meta description (price, sizes, COD, free delivery, discreet)
    // — the facts search + AI answer engines extract, with the "price in
    // pakistan" phrase folded in.
    const description =
      meta.seo_description ||
      `Shop ${name.toLowerCase()} online in Pakistan at ${BRAND.name} — latest designs and prices, all sizes, Cash on Delivery, free delivery over Rs 3,000 and discreet packaging.`
    const canonical = absoluteUrl(categoryPath(productCategory))

    // Empty categories are kept out of the index (see isIndexableCategory).
    // Counted rather than hardcoded so the page returns to the index by itself
    // once products are assigned to it.
    const {
      response: { count },
    } = await listProducts({
      countryCode: "pk",
      queryParams: {
        category_id: [productCategory.id],
        limit: 1,
        fields: "handle",
      } as HttpTypes.FindParams & HttpTypes.StoreProductListParams,
    })

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
