import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex items-baseline gap-x-3.5">
      <span
        className={clx("text-[28px] font-medium text-accent")}
        data-testid="product-price"
        data-value={selectedPrice.calculated_price_number}
      >
        {!variant && (
          <span className="text-sm text-ink/45 font-normal mr-1">From</span>
        )}
        {selectedPrice.calculated_price}
      </span>
      {selectedPrice.price_type === "sale" && (
        <>
          <span
            className="text-lg text-ink/40 line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="text-[11px] tracking-[0.12em] uppercase bg-burgundy-50 text-accent px-2.5 py-1.5">
            Save {selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
