/**
 * Delivery charge rules.
 *
 * "Free delivery over Rs 3,000" is promised across the FAQs, category copy and
 * landing pages, but the charge *below* that threshold is stated nowhere in the
 * codebase, so the fee below is an assumption. Override either value from the
 * environment without touching code:
 *
 *   NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD   default 3000
 *   NEXT_PUBLIC_SHIPPING_FEE              default 250
 *
 * Both are NEXT_PUBLIC because the cart and checkout quote the charge in the
 * browser, while the order endpoint recomputes it server-side from the same
 * numbers — the two must not be able to disagree.
 */

function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const FREE_SHIPPING_THRESHOLD = envNumber(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD,
  3000
)

export const SHIPPING_FEE = envNumber(process.env.NEXT_PUBLIC_SHIPPING_FEE, 250)

/** Delivery charge for a given item subtotal. */
export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}
