"use client"

import { useEffect, useState } from "react"

import { lineItemsToGaItems } from "@lib/analytics"
import { useLocalCart } from "@lib/local-cart"
import { BeginCheckout } from "@modules/analytics/ecommerce-events"
import ExpressCheckout from "@modules/checkout/components/express-checkout"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * Client shell for checkout.
 *
 * The bag is in localStorage, so it is unreadable until after hydration. The
 * `mounted` guard exists because the first client render deliberately matches
 * the server's empty snapshot — without it, every visitor would see "your bag
 * is empty" flash before their real bag appeared.
 */
export default function LocalCheckout() {
  const { cart } = useLocalCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="content-container py-20">
        <div className="mx-auto h-[420px] max-w-5xl animate-pulse bg-cream-200/50" />
      </div>
    )
  }

  if (!cart?.items?.length) {
    return (
      <div className="content-container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="font-display text-[32px] font-medium leading-none text-ink">
          Your bag is empty
        </h1>
        <p className="max-w-[380px] text-[14px] font-light leading-[1.7] text-ink/60">
          Add something you love and it will appear here, ready for checkout.
        </p>
        <LocalizedClientLink href="/shop">
          <Button className="h-[52px] px-10 tracking-[0.16em]">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="content-container py-10 small:py-14">
      <BeginCheckout items={lineItemsToGaItems(cart.items)} />
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 small:grid-cols-[1fr_390px] small:gap-14">
        <div className="border border-cream-300 bg-[#fffdf9] p-7 small:p-10">
          <ExpressCheckout />
        </div>
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
