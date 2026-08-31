"use client"

import { useLocalCart } from "@lib/local-cart"
import CartDropdown from "../cart-dropdown"

/**
 * Header bag button.
 *
 * Reads the browser-side cart rather than Medusa, so the count stays in sync
 * with every add, quantity change and removal without a round trip.
 */
export default function CartButton() {
  const { cart } = useLocalCart()

  return <CartDropdown cart={cart} />
}
