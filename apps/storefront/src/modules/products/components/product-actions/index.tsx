"use client"

import { addLocalCartItem } from "@lib/local-cart"
import { GA_CURRENCY, toGaItem, trackEvent } from "@lib/analytics"
import { metaContentPayload, trackMetaEvent } from "@lib/meta-pixel"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import { getProductTeaser } from "@lib/util/product-teaser"
import {
  getProductSizes,
  isBraSized,
  optionValuesForSize,
} from "@lib/util/product-sizes"
import dynamicImport from "next/dynamic"

/**
 * Loaded only when the shopper opens it.
 *
 * The finder pulls in the sizing maths and its own dialog markup, and most
 * visitors to a bra page never open it — there is no reason for it to be in the
 * bundle every product page ships.
 */
const SizeFinderModal = dynamicImport(
  () => import("@modules/sizing/components/size-finder-modal"),
  { ssr: false }
)

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [sizeFinderOpen, setSizeFinderOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [favourite, setFavourite] = useState(false)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  /**
   * Whether the bra size calculator can honestly answer for this product.
   *
   * Bras only. It returns a band and a cup, and nothing maps those onto a
   * nightdress sold in S/M/L — see `isBraSized`.
   */
  const showSizeFinder = useMemo(() => isBraSized(product), [product])

  /** Size labels this product is listed in, e.g. ["34B","34C"]. */
  const productSizes = useMemo(() => getProductSizes(product), [product])

  /**
   * The first size option AS DISPLAYED, which is where the trigger renders.
   *
   * Not `getSizeOptionIds()[0]` — that list is sorted band-first so labels read
   * "34C" rather than "C34", and this product shows Cup Size above Size, so the
   * trigger would hang off the second row.
   */
  const firstSizeOptionId = useMemo(
    () => (product.options ?? []).find((o) => /size/i.test(o.title ?? ""))?.id,
    [product]
  )

  /**
   * Apply a size chosen in the finder to the option selector.
   *
   * Only the size options are set. Colour is left for the shopper, so picking
   * "34C" on a bra that comes in three colours does not quietly choose one.
   */
  const applySize = (label: string) => {
    const values = optionValuesForSize(product, label)
    if (!values) return
    setOptions((prev) => ({ ...prev, ...values }))
  }

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    // The bag is held in localStorage, not Medusa: see lib/local-cart.ts.
    const price = (selectedVariant as any)?.calculated_price?.calculated_amount
    const item = toGaItem(product, {
      item_variant: selectedVariant.title ?? undefined,
      price,
      quantity,
    })

    trackEvent("add_to_cart", {
      currency: GA_CURRENCY,
      value: (price ?? 0) * quantity,
      items: [item],
    })

    trackMetaEvent(
      "AddToCart",
      metaContentPayload([item], {
        content_name: item.item_name,
        content_category: item.item_category,
      })
    )

    addLocalCartItem(
      {
        variant_id: selectedVariant.id,
        product_id: product.id,
        product_handle: product.handle || "",
        product_title: product.title || "",
        variant_title: selectedVariant.title || "",
        thumbnail: selectedVariant.thumbnail || product.thumbnail || null,
        unit_price: price ?? 0,
      },
      quantity
    )

    setIsAdding(false)
  }

  const canAdd =
    inStock && !!selectedVariant && !disabled && !isAdding && isValidVariant

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        {/* Price */}
        <ProductPrice product={product} variant={selectedVariant} />

        {/* Short teaser description */}
        <p className="max-w-[440px] text-[14.5px] font-light leading-[1.75] text-[#5c4d42]">
          {getProductTeaser(product)}
        </p>

        {/* Size / option selectors */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-5">
            {(product.options || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.id]}
                updateOption={setOptionValue}
                title={option.title ?? ""}
                // Only on the first size option: a bra has both "Size" and
                // "Cup Size", and the old label rendered against each of them,
                // so the row showed "Size guide" twice.
                sizeGuide={
                  showSizeFinder && option.id === firstSizeOptionId ? (
                    <button
                      type="button"
                      onClick={() => setSizeFinderOpen(true)}
                      // Matches the option buttons beside it. While the
                      // Suspense fallback is on screen every other control is
                      // disabled, and a finder that opened there would take a
                      // size and lose it the moment the real component mounts.
                      disabled={!!disabled || isAdding}
                      className="shrink-0 border-b border-bronze-200 text-[12px] text-gold transition-colors hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-40 disabled:hover:border-bronze-200 disabled:hover:text-gold"
                    >
                      Find my size
                    </button>
                  ) : undefined
                }
                data-testid="product-options"
                disabled={!!disabled || isAdding}
              />
            ))}
          </div>
        )}

        {/* Quantity + Add to Bag + Favourite */}
        <div className="flex items-stretch gap-3.5">
          <div className="flex items-center border border-[#d8c6ae]">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-[54px] w-[46px] items-center justify-center text-xl text-accent transition-colors hover:bg-bronze-100"
            >
              −
            </button>
            <span className="w-11 text-center text-[15px] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-[54px] w-[46px] items-center justify-center text-xl text-accent transition-colors hover:bg-bronze-100"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!canAdd}
            variant="primary"
            className="h-[54px] flex-1 tracking-[0.16em]"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant && (product.variants?.length ?? 0) > 1
              ? "Select size"
              : !inStock || !isValidVariant
              ? "Out of stock"
              : "Add to Bag"}
          </Button>

          <button
            type="button"
            aria-label={favourite ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={favourite}
            onClick={() => setFavourite((v) => !v)}
            className="flex h-[54px] w-[54px] items-center justify-center border border-[#d8c6ae] transition-colors hover:border-accent"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={favourite ? "#6d1430" : "none"}
              stroke="#6d1430"
              strokeWidth="1.6"
            >
              <path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2 4.8 5.4 4.5 7.7 4.3 9.4 5.7 12 8c2.6-2.3 4.3-3.7 6.6-3.5C22 4.8 23.5 8.4 22 11.7 19.5 16.4 12 21 12 21z" />
            </svg>
          </button>
        </div>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />

        {sizeFinderOpen && (
          <SizeFinderModal
            productSizes={productSizes}
            productTitle={product.title ?? ""}
            onSelectSize={applySize}
            onClose={() => setSizeFinderOpen(false)}
          />
        )}
      </div>
    </>
  )
}
