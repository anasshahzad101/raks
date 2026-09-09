"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { saveLastOrder } from "@lib/last-order"
import { clearLocalCart, readLocalCart } from "@lib/local-cart"
import ErrorMessage from "@modules/checkout/components/error-message"
import Input from "@modules/common/components/input"
import { Button } from "@modules/common/components/ui"

/**
 * One-page Cash-on-Delivery checkout.
 *
 * Posts the bag to `/api/orders`, which rebuilds every line from the catalog
 * snapshot and emails the order — there is no Medusa backend to place it with.
 * Only variant ids and quantities are sent: prices are decided server-side, so
 * nothing here can influence what an order costs.
 */
const ExpressCheckout = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const items = readLocalCart()
    if (!items.length) {
      setError("Your bag is empty.")
      return
    }

    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? "").trim()

    setSubmitting(true)

    try {
      // Trailing slash matters: next.config.js sets trailingSlash, so the
      // bare path answers with a 308 and costs an extra round trip.
      const response = await fetch("/api/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            first_name: field("first_name"),
            last_name: field("last_name"),
            email: field("email"),
            phone: field("phone"),
            address: field("address"),
            city: field("city"),
            province: field("province"),
            postal_code: field("postal_code"),
            notes: field("notes"),
          },
          items: items.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? "We could not place your order. Please retry.")
        setSubmitting(false)
        return
      }

      // Stash before clearing: the confirmation page reports this to Analytics.
      saveLastOrder(data)
      clearLocalCart()
      router.push("/order/thank-you")
    } catch {
      setError(
        "We could not reach the store. Check your connection and try again."
      )
      setSubmitting(false)
    }
  }

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

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="express-first-name"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Phone number"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          data-testid="express-phone"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Input
          label="Delivery address"
          name="address"
          required
          autoComplete="street-address"
          data-testid="express-address"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            required
            autoComplete="address-level2"
          />
          <Input
            label="Province (optional)"
            name="province"
            autoComplete="address-level1"
          />
        </div>
        <Input
          label="Delivery notes (optional)"
          name="notes"
          autoComplete="off"
        />

        <ErrorMessage error={error} data-testid="express-error" />

        <Button
          type="submit"
          variant="primary"
          isLoading={submitting}
          disabled={submitting}
          className="mt-3 h-[56px] w-full tracking-[0.16em]"
          data-testid="place-order-button"
        >
          Place Order · Cash on Delivery
        </Button>

        <p className="mt-1 text-center text-[12px] text-ink/50">
          Free delivery over Rs 3,000 · Plain, discreet packaging · Easy 15-day
          exchange
        </p>
      </form>
    </div>
  )
}

export default ExpressCheckout
