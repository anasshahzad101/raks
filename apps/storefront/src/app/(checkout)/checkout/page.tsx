import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import ExpressCheckout from "@modules/checkout/components/express-checkout"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { BeginCheckout } from "@modules/analytics/ecommerce-events"
import { lineItemsToGaItems } from "@lib/analytics"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="content-container py-10 small:py-14">
      {/* GA4: entering checkout with a non-empty cart. */}
      {!!cart.items?.length && (
        <BeginCheckout items={lineItemsToGaItems(cart.items)} />
      )}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 small:grid-cols-[1fr_390px] small:gap-14">
        <div className="border border-cream-300 bg-[#fffdf9] p-7 small:p-10">
          <ExpressCheckout cart={cart} customer={customer} />
        </div>
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
