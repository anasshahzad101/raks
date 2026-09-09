import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { PRODUCT_OPTION_FIELDS } from "@lib/util/product-fields"
import { toPlainText } from "@lib/util/plain-text"
import { categoryH1 } from "@lib/util/category-seo"
import { extractComposition } from "@lib/util/composition"
import { categoryPath } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { BRAND, absoluteUrl, productUrl } from "@lib/raks"
import { toGaItem } from "@lib/analytics"
import { ViewItem } from "@modules/analytics/ecommerce-events"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const { response } = await listProducts({
      countryCode: "pk",
      queryParams: { limit: 1000, fields: "handle" },
    })
    return response.products
      .filter((p) => p.handle)
      .map((p) => ({ handle: p.handle as string }))
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }
  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }
  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params

  const product = await listProducts({
    countryCode: "pk",
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const meta = (product.metadata ?? {}) as Record<string, string>
  const title = meta.seo_title || `${product.title} | ${BRAND.name}`
  const description =
    meta.seo_description ||
    (product.description
      ? toPlainText(product.description).slice(0, 160)
      : `${product.title} — shop at ${BRAND.name}, Pakistan.`)
  const canonical = absoluteUrl(productUrl(product.handle!))
  const image = product.thumbnail ? absoluteUrl(product.thumbnail) : undefined

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: BRAND.name,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion("pk")
  const searchParams = await props.searchParams
  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: "pk",
    queryParams: { handle: params.handle, fields: PRODUCT_OPTION_FIELDS },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  // Product structured data (JSON-LD) for rich results
  // Descriptions are migrated WordPress HTML, so tags and character entities
  // both have to come out — a raw "&amp;" in JSON-LD is a literal ampersand-a-m-p
  // to a consumer, not an "&".
  const prices = (pricedProduct.variants ?? [])
    .map((v) => (v as any).calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number" && n > 0)
  const lowPrice = prices.length ? Math.min(...prices) : undefined
  const highPrice = prices.length ? Math.max(...prices) : undefined

  // No Review/AggregateRating markup: RAKS has no verified review data yet, and
  // Google's review-snippet policy forbids marking up ratings that are not real.
  // Re-add only when reviews are collected from genuine orders and shown on-page.

  // Distinct option values across the variants, so an assistant asked "does this
  // come in black, 34B?" can answer from the markup instead of guessing. Only
  // options the product actually defines are emitted; nothing is invented.
  const optionValues = (title: RegExp): string[] => {
    const seen = new Set<string>()
    for (const v of pricedProduct.variants ?? []) {
      for (const o of ((v as any).options ?? []) as any[]) {
        if (title.test(o?.option?.title ?? "") && o?.value) seen.add(String(o.value))
      }
    }
    // Array.from, not spread: tsconfig targets es5 and spreading a Set errors.
    return Array.from(seen)
  }
  const colors = optionValues(/^colou?r$/i)
  const sizes = optionValues(/^sizes?$/i)
  const cupSizes = optionValues(/^cup size$/i)
  // Same source as the visible "Fabric & Care" panel, so the markup and the
  // page cannot state different materials. Null for products with none stated.
  const material = extractComposition(pricedProduct.description)

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: pricedProduct.title,
    image: (pricedProduct.images ?? []).map((i) => absoluteUrl(i.url)),
    description: toPlainText(pricedProduct.description).slice(0, 500),
    brand: { "@type": "Brand", name: BRAND.name },
    // No variant in the migrated catalog carries a SKU, so this is omitted
    // rather than filled with an internal id dressed up as one.
    sku: pricedProduct.variants?.[0]?.sku || undefined,
    itemCondition: "https://schema.org/NewCondition",
    ...(colors.length ? { color: colors } : {}),
    ...(sizes.length ? { size: sizes } : {}),
    ...(material ? { material } : {}),
    ...(cupSizes.length
      ? {
          additionalProperty: cupSizes.map((value) => ({
            "@type": "PropertyValue",
            name: "Cup size",
            value,
          })),
        }
      : {}),
    offers:
      lowPrice !== undefined
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "PKR",
            lowPrice,
            highPrice,
            offerCount: pricedProduct.variants?.length ?? 1,
            // Every variant in the catalog has inventory management switched
            // off, so anything with a price is orderable. Products with no
            // price emit no offers block at all, which is why this is not a
            // blanket claim.
            availability: "https://schema.org/InStock",
            url: absoluteUrl(productUrl(pricedProduct.handle!)),
          }
        : undefined,
  }

  // Breadcrumb follows the product's real category chain. It used to read
  // Home > Shop > Product, which hid the category the product actually sits in
  // and did not match the breadcrumb rendered on the page.
  const crumbCategory = (pricedProduct.categories ?? []).find(
    (c) => !/^(lingerie|nightdress)$/i.test(c.name ?? "")
  ) ?? pricedProduct.categories?.[0]

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      ...(crumbCategory
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: categoryH1(crumbCategory),
              item: absoluteUrl(categoryPath(crumbCategory)),
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: "Shop",
              item: absoluteUrl("/shop/"),
            },
          ]),
      {
        "@type": "ListItem",
        position: 3,
        name: pricedProduct.title,
        item: absoluteUrl(productUrl(pricedProduct.handle!)),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ViewItem item={toGaItem(pricedProduct)} />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode="pk"
        images={images ?? []}
      />
    </>
  )
}
