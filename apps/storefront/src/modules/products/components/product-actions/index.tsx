"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import { getProductTeaser } from "@lib/util/product-teaser"

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
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [favourite, setFavourite] = useState(false)
  const countryCode = (useParams().countryCode as string) || "pk"

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

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

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
      </div>
    </>
  )
}
