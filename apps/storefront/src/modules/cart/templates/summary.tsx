"use client"

import { Button, Heading } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

/**
 * Discount codes are gone with the backend — promotions are evaluated by Medusa,
 * and there is nothing to evaluate them. Checkout is a single page, so the
 * step query parameter went with it.
 */
const Summary = ({ cart }: SummaryProps) => {
  return (
    <div className="flex flex-col gap-y-5 border border-cream-300 bg-[#fffdf9] p-7">
      <Heading
        level="h2"
        className="font-display font-medium !font-medium text-[26px] leading-none text-ink"
      >
        Order Summary
      </Heading>
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink href="/checkout" data-testid="checkout-button">
        <Button className="w-full h-[52px]">Checkout</Button>
      </LocalizedClientLink>
      <p className="text-center text-[11.5px] text-ink/55 tracking-[0.04em]">
        Cash on delivery · Pay when it arrives
      </p>
    </div>
  )
}

export default Summary
