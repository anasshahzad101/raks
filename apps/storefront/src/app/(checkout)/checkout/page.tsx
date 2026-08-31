import LocalCheckout from "@modules/checkout/templates/local-checkout"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
}

/**
 * Checkout reads the browser-side bag and posts it to `/api/orders`, which
 * emails the order. Nothing is fetched here — see `local-checkout.tsx`.
 */
export default function Checkout() {
  return <LocalCheckout />
}
