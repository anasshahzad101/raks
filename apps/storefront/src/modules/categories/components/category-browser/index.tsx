"use client"

import { ReactNode, useMemo, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductCard from "@modules/products/components/product-card"
import { getProductSizes, sortSizes } from "@lib/util/product-sizes"

/**
 * Category page body: a filter sidebar (the server-rendered CATEGORY list slot,
 * plus a SIZE filter) beside the product grid. Size filtering happens instantly
 * on the client over the already-loaded products — no reload.
 */
export default function CategoryBrowser({
  products,
  region,
  categoryNav,
}: {
  products: HttpTypes.StoreProduct[]
  region?: HttpTypes.StoreRegion
  categoryNav: ReactNode
}) {
  const [selected, setSelected] = useState<string[]>([])

  const allSizes = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => getProductSizes(p).forEach((s) => set.add(s)))
    return sortSizes([...set])
  }, [products])

  const filtered = useMemo(() => {
    if (!selected.length) return products
    return products.filter((p) =>
      getProductSizes(p).some((s) => selected.includes(s))
    )
  }, [products, selected])

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
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
              Size
            </h2>
            <div className="flex flex-wrap gap-2">
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
