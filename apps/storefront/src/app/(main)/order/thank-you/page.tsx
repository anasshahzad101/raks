import EmailOrderConfirmation from "@modules/order/templates/email-order-confirmation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Order Received",
  description: "Your order has been received",
  robots: { index: false, follow: false },
}

/**
 * Confirmation for orders taken by email while there is no Medusa backend.
 * Medusa's own `/order/[id]/confirmed` page is left in place for whenever the
 * backend returns.
 */
export default function ThankYouPage() {
  return <EmailOrderConfirmation />
}
