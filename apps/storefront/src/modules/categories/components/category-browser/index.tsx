"use client"

import { ReactNode, useMemo, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductCard from "@modules/products/components/product-card"
import { sortSizes } from "@lib/util/product-sizes"
import type { SizeLookup } from "@lib/util/slim-product"

/**
 * Category page body: a filter sidebar (the server-rendered CATEGORY list slot,
 * plus a SIZE filter) beside the product grid. Size filtering happens instantly
 * on the client over the already-loaded products — no reload.
 *
 * Sizes arrive precomputed. Deriving them here meant shipping every product's
 * full option data into the RSC payload, which is what made this page's HTML
 * around a megabyte of inlined JSON.
 */
export default function CategoryBrowser({
  products,
  sizesByProduct,
  region,
  categoryNav,
}: {
  products: HttpTypes.StoreProduct[]
  sizesByProduct: SizeLookup
  region?: HttpTypes.StoreRegion
  categoryNav: ReactNode
}) {
  const [selected, setSelected] = useState<string[]>([])

  const allSizes = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) =>
      (sizesByProduct[p.id] ?? []).forEach((s) => set.add(s))
    )
    return sortSizes(Array.from(set))
  }, [products, sizesByProduct])

  const filtered = useMemo(() => {
    if (!selected.length) return products
    return products.filter((p) =>
      (sizesByProduct[p.id] ?? []).some((s) => selected.includes(s))
    )
  }, [products, sizesByProduct, selected])

  const toggle = (size: string) =>
    setSelected((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  const clear = () => setSelected([])

  return (
    <div className="flex flex-col gap-y-10 small:flex-row small:gap-x-12">
      {/* Sidebar */}
      <aside className="small:w-[210px] small:shrink-0">
        {categoryNav}

        {allSizes.length > 0 && (
          <div className="mt-9">
            {/* Filter label, not a heading — see the note in category-nav. */}
            <p
              id="size-filter-label"
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
            >
              Size
            </p>
            <div
              role="group"
              aria-labelledby="size-filter-label"
              className="flex flex-wrap gap-2"
            >
              {allSizes.map((size) => {
                const on = selected.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggle(size)}
                    aria-pressed={on}
                    className={`min-w-[44px] border px-2.5 py-2 text-[12px] transition-colors ${
                      on
                        ? "border-accent bg-accent text-cream-50"
                        : "border-cream-300 text-ink hover:border-accent"
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="mt-7 text-[11px] uppercase tracking-[0.18em] text-gold-deep underline underline-offset-4 transition-colors hover:text-accent"
          >
            Clear all
          </button>
        )}
      </aside>

      {/* Product grid */}
      <div className="flex-1">
        {/* Gives the product titles (h3) a section to nest under, so the outline
            reads h1 > h2 Products > h3 product, instead of leaving 13 h3s
            hanging off a filter label. Visually hidden because the grid is
            self-evident on screen; screen reader and outline users still get it. */}
        <h2 className="sr-only">Products</h2>
        {filtered.length > 0 ? (
          <ul
            className="grid grid-cols-2 gap-x-6 gap-y-10 small:grid-cols-3"
            data-testid="products-list"
          >
            {filtered.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} region={region} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-[22px] text-ink">
              No products match those sizes
            </p>
            <button
              type="button"
              onClick={clear}
              className="mt-4 text-[12px] uppercase tracking-[0.16em] text-accent underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
