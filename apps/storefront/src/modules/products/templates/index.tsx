import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductAccordions from "@modules/products/components/product-accordions"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BRAND, POLICY, deliveryWindow } from "@lib/raks"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const category = product.categories?.[0]

  // Whether this product can actually be bought. About 28 of the 207 migrated
  // products never had a price in the source WooCommerce data; they stay
  // published to preserve their indexed URLs, but the buy button correctly
  // renders "Out of stock" for them. The reassurance line below used to say
  // "In stock" on those same pages regardless, so one product page asserted both
  // at once.
  const isPurchasable = (product.variants ?? []).some(
    (v) => ((v as any).calculated_price?.calculated_amount ?? 0) > 0
  )

  return (
    <>
      <div className="content-container py-8 small:py-12" data-testid="product-container">
        {/* Breadcrumb */}
        <nav className="text-xs tracking-[0.05em] text-ink/55 mb-8">
          <LocalizedClientLink href="/" className="hover:text-accent transition-colors">
            Home
          </LocalizedClientLink>
          {category && (
            <>
              <span className="mx-2">/</span>
              <LocalizedClientLink
                href={`/product-category/${category.handle}/`}
                className="hover:text-accent transition-colors"
              >
                {category.name}
              </LocalizedClientLink>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-ink line-clamp-1 inline">{product.title}</span>
        </nav>

        {/* Main: gallery + purchase panel */}
        <div className="flex flex-col gap-y-8 small:flex-row small:items-start small:gap-x-14">
          {/* Gallery */}
          <div className="w-full small:w-[55%]">
            <ImageGallery images={images} title={product.title ?? undefined} />
          </div>

          {/* Purchase panel */}
          <div className="w-full small:w-[45%]">
            <div className="flex flex-col gap-y-7">
              <ProductInfo product={product} />

              <Suspense
                fallback={
                  <ProductActions
                    disabled={true}
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>

              {/* Stock / shipping reassurance. Delivery timing comes from POLICY
                  so it cannot drift from the FAQ, llms.txt and agents.md again. */}
              <div className="flex items-center gap-2 text-[12.5px] text-ink/60 border-t border-cream-300 pt-5">
                {isPurchasable ? (
                  <>
                    <span className="text-[#5a8a5f]">●</span>
                    Available to order · delivery in {deliveryWindow()} ·{" "}
                    {POLICY.packaging}
                  </>
                ) : (
                  <>
                    <span className="text-ink/35">●</span>
                    Currently unavailable to order online — email{" "}
                    <a href={`mailto:${BRAND.email}`} className="underline hover:text-accent">
                      {BRAND.email}
                    </a>{" "}
                    to ask about this piece
                  </>
                )}
              </div>

              {/* Description / Fabric & Care / Shipping accordions */}
              <ProductAccordions product={product} />

              <ProductOnboardingCta />
            </div>
          </div>
        </div>
      </div>

      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
