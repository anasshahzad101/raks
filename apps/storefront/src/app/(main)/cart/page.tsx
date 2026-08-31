import LocalCartView from "@modules/cart/templates/local-cart-view"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
  robots: { index: false, follow: false },
}

/**
 * The bag is held in the browser (`lib/local-cart.ts`) while raks.pk runs
 * without a Medusa backend, so there is nothing to fetch here — the client
 * component reads it after hydration.
 */
export default function Cart() {
  return <LocalCartView />
}
