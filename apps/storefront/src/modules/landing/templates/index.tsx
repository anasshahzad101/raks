import { Suspense } from "react"

import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { getCategoryByHandle } from "@lib/data/categories"
import ProductPreview from "@modules/products/components/product-preview"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import FaqSection from "@modules/common/components/faq-section"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCategoryFaqs } from "@lib/faqs"
import { LandingPage } from "@lib/landing-pages"

async function LandingProducts({
  query,
  categoryHandle,
}: {
  query: string
  categoryHandle?: string
}) {
  const region = await getRegion("pk")
  if (!region) {
    return null
  }

  // Optionally scope the keyword search to a category (e.g. "cotton" within
  // Bras) so results stay precise.
  let categoryId: string | undefined
  if (categoryHandle) {
    const cat = await getCategoryByHandle([categoryHandle]).catch(() => null)
    categoryId = cat?.id
  }

  const queryParams: Record<string, unknown> = { q: query, limit: 24 }
  if (categoryId) {
    queryParams.category_id = [categoryId]
  }

  const { response } = await listProducts({
    countryCode: "pk",
    queryParams: queryParams as any,
  })

  const products = response.products

  if (!products.length) {
    return (
      <p className="text-ink/60">
        No matching products right now.{" "}
        <LocalizedClientLink href="/shop/" className="text-bronze-600 underline">
          Browse all products
        </LocalizedClientLink>
        .
      </p>
    )
  }

  return (
    <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductPreview product={p} region={region} />
        </li>
      ))}
    </ul>
  )
}

export default function LandingTemplate({ page }: { page: LandingPage }) {
  return (
    <div className="content-container py-6 small:py-10">
      {/* Header: breadcrumb + title + intro */}
      <div className="mb-8 flex flex-col gap-y-3">
        <nav className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-luxe text-ink/50">
          <LocalizedClientLink href="/" className="hover:text-ink">
            Home
          </LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink href="/shop/" className="hover:text-ink">
            Shop
          </LocalizedClientLink>
          <span>/</span>
          <span className="text-ink/70">{page.heading}</span>
        </nav>
        <h1 className="font-display text-4xl text-ink small:text-5xl">
          {page.heading}
        </h1>
        <p className="max-w-3xl leading-relaxed text-ink/70">{page.intro}</p>
      </div>

      {/* Product grid */}
      <div className="border-t border-bronze-100 pt-8">
        <Suspense fallback={<SkeletonProductGrid />}>
          <LandingProducts
            query={page.query}
            categoryHandle={page.categoryHandle}
          />
        </Suspense>
      </div>

      {/* FAQs + FAQPage schema */}
      <FaqSection
        faqs={getCategoryFaqs(page.heading)}
        title={`${page.heading} — Frequently Asked Questions`}
        className="mt-16 small:mt-24 max-w-3xl"
      />
    </div>
  )
}
