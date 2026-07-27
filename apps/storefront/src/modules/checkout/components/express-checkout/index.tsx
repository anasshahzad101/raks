"use client"

import { useActionState } from "react"
import { HttpTypes } from "@medusajs/types"
import { placeOrderExpress } from "@lib/data/cart"
import Input from "@modules/common/components/input"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import ErrorMessage from "@modules/checkout/components/error-message"

/**
 * One-page Cash-on-Delivery checkout: a single delivery form that places the
 * order in one submit (address + delivery + COD payment all handled server-side
 * by placeOrderExpress). No steps, no account required.
 */
const ExpressCheckout = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
}) => {
  const [message, formAction] = useActionState(placeOrderExpress, null)
  const sa = cart?.shipping_address

  return (
    <div>
      <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-gold">
        Cash on Delivery
      </div>
      <h1 className="mb-2 font-display text-[34px] font-medium leading-none text-ink small:text-[40px]">
        Checkout
      </h1>
      <p className="mb-8 max-w-[440px] text-[14px] font-light leading-[1.7] text-ink/60">
        Add your delivery details and place your order — pay in cash when it
        arrives. No account needed.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            defaultValue={sa?.first_name || customer?.first_name || ""}
            data-testid="express-first-name"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            defaultValue={sa?.last_name || customer?.last_name || ""}
          />
        </div>

        <Input
          label="Phone number"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          defaultValue={sa?.phone || customer?.phone || ""}
          data-testid="express-phone"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={cart?.email || customer?.email || ""}
        />
        <Input
          label="Delivery address"
          name="address_1"
          required
          autoComplete="street-address"
          defaultValue={sa?.address_1 || ""}
          data-testid="express-address"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            required
            autoComplete="address-level2"
            defaultValue={sa?.city || ""}
          />
          <Input
            label="Province (optional)"
            name="province"
            autoComplete="address-level1"
            defaultValue={sa?.province || ""}
          />
        </div>

        <ErrorMessage error={message} data-testid="express-error" />

        <SubmitButton
          className="mt-3 h-[56px] w-full tracking-[0.16em]"
          data-testid="place-order-button"
        >
          Place Order · Cash on Delivery
        </SubmitButton>

        <p className="mt-1 text-center text-[12px] text-ink/50">
          Free delivery over ₨3,000 · Plain, discreet packaging · Easy 15-day
          exchange
        </p>
      </form>
    </div>
  )
}

export default ExpressCheckout
