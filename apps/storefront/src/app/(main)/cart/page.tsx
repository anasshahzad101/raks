import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { ViewCart } from "@modules/analytics/ecommerce-events"
import { lineItemsToGaItems } from "@lib/analytics"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
  robots: { index: false, follow: false },
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return (
    <>
      {/* GA4: only a cart with contents is worth reporting as viewed. */}
      {!!cart?.items?.length && (
        <ViewCart items={lineItemsToGaItems(cart.items)} />
      )}
      <CartTemplate cart={cart} customer={customer} />
    </>
  )
}
