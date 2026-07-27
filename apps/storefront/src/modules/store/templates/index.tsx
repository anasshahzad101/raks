import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SortDropdown from "@modules/store/components/refinement-list/sort-dropdown"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="content-container py-8 small:py-12" data-testid="category-container">
      {/* Breadcrumb */}
      <nav className="text-xs tracking-[0.05em] text-ink/55 mb-6">
        <LocalizedClientLink href="/" className="hover:text-accent transition-colors">
          Home
        </LocalizedClientLink>
        <span className="mx-2">/</span>
        <span className="text-ink">Shop</span>
      </nav>

      {/* Header + sort */}
      <div className="flex items-end justify-between gap-4 border-b border-cream-300 pb-6 mb-9">
        <div>
          <h1
            className="font-display font-medium text-[40px] small:text-[46px] text-ink m-0 leading-none"
            data-testid="store-page-title"
          >
            All Products
          </h1>
          <p className="text-[13px] text-ink/55 mt-2 tracking-[0.04em]">
            The full RAKS collection — lingerie, nightwear &amp; more
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden small:inline text-[11px] tracking-[0.16em] uppercase text-ink/55">
            Sort
          </span>
          <SortDropdown sortBy={sort} data-testid="sort-by-container" />
        </div>
      </div>

      {/* Full-width product grid */}
      <Suspense fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          countryCode={countryCode}
        />
      </Suspense>
    </div>
  )
}

export default StoreTemplate
