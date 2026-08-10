import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { PRODUCT_OPTION_FIELDS } from "@lib/util/product-fields"
import { getProductReviews } from "@lib/reviews"
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
      ? product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
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
  const prices = (pricedProduct.variants ?? [])
    .map((v) => (v as any).calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number" && n > 0)
  const lowPrice = prices.length ? Math.min(...prices) : undefined
  const highPrice = prices.length ? Math.max(...prices) : undefined

  // Reviews (same deterministic data shown in the visible reviews section, so
  // the AggregateRating/Review markup matches on-page content per Google's rules).
  const { average, count, reviews } = getProductReviews(pricedProduct)

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: pricedProduct.title,
    image: (pricedProduct.images ?? []).map((i) => absoluteUrl(i.url)),
    description: (pricedProduct.description || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500),
    brand: { "@type": "Brand", name: BRAND.name },
    sku: pricedProduct.variants?.[0]?.sku || undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: average,
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      datePublished: r.date,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      name: r.title,
      reviewBody: r.body,
    })),
    offers:
      lowPrice !== undefined
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "PKR",
            lowPrice,
            highPrice,
            offerCount: pricedProduct.variants?.length ?? 1,
            availability: "https://schema.org/InStock",
            url: absoluteUrl(productUrl(pricedProduct.handle!)),
          }
        : undefined,
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/shop/") },
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
