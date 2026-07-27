import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductAccordions from "@modules/products/components/product-accordions"
import ProductReviews from "@modules/products/components/product-reviews"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
            <ImageGallery images={images} />
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

              {/* Stock / shipping reassurance */}
              <div className="flex items-center gap-2 text-[12.5px] text-ink/60 border-t border-cream-300 pt-5">
                <span className="text-[#5a8a5f]">●</span>
                In stock · ships in 1–2 days · discreet packaging
              </div>

              {/* Description / Fabric & Care / Shipping accordions */}
              <ProductAccordions product={product} />

              <ProductOnboardingCta />
            </div>
          </div>
        </div>

        {/* Customer reviews (visible content backing the AggregateRating schema) */}
        <ProductReviews product={product} />
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
