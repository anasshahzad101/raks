import { getProductPrice } from "@lib/util/get-product-price"
import { toGaItem } from "@lib/analytics"
import { SelectItem } from "@modules/analytics/ecommerce-events"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  const priceMissing = meta.price_missing === true || meta.price_missing === "true"

  const onSale = cheapestPrice && cheapestPrice.price_type === "sale"
  const discountPct =
    onSale && cheapestPrice.original_price_number > 0
      ? Math.round(
          (1 - cheapestPrice.calculated_price_number / cheapestPrice.original_price_number) * 100
        )
      : 0

  const category = product.categories?.[0]?.name

  return (
    <SelectItem item={toGaItem(product)}>
    <LocalizedClientLink href={`/product/${product.handle}/`} className="group block">
      <div
        data-testid="product-wrapper"
        className="relative overflow-hidden bg-[#fffdf9] border border-cream-200 group-hover:border-accent transition-colors"
      >
        {/* Sale badge */}
        {onSale && discountPct > 0 && (
          <span className="absolute top-3.5 left-0 z-10 bg-accent text-white text-[11px] font-semibold tracking-[0.14em] uppercase px-4 py-2">
            -{discountPct}%
          </span>
        )}

        {/* Wishlist heart */}
        <span
          aria-label="Favourite"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 flex items-center justify-center bg-[#fffdf9]/85 rounded-full text-ink/40 group-hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 21s-7-4.6-9.3-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.3 6.5C19 16.4 12 21 12 21z" strokeLinejoin="round" />
          </svg>
        </span>

        <div className="aspect-[3/4] overflow-hidden">
          <div className="h-full transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="full"
              isFeatured={isFeatured}
              alt={product.title ?? undefined}
            />
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        {category && (
          <div className="text-[10.5px] tracking-[0.18em] uppercase text-gold mb-1.5">
            {category}
          </div>
        )}
        <h3
          className="font-display text-[18px] leading-snug text-ink line-clamp-2 group-hover:text-accent transition-colors"
          data-testid="product-title"
        >
          {product.title}
        </h3>
        <div className="flex items-center gap-x-2.5 mt-2">
          {priceMissing ? (
            <span className="text-[13px] text-ink/50 italic">Price on request</span>
          ) : (
            cheapestPrice && <PreviewPrice price={cheapestPrice} />
          )}
        </div>
      </div>
    </LocalizedClientLink>
    </SelectItem>
  )
}
