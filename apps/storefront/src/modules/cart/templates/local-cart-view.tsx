"use client"

import { useEffect, useState } from "react"

import { lineItemsToGaItems } from "@lib/analytics"
import { useLocalCart } from "@lib/local-cart"
import { ViewCart } from "@modules/analytics/ecommerce-events"
import CartTemplate from "./index"

/**
 * Client wrapper for the bag page.
 *
 * The cart lives in localStorage, so it can only be read after hydration —
 * hence the client component rather than a server-side load. The `mounted`
 * guard is what stops "your bag is empty" flashing on every visit: the first
 * client render deliberately matches the server's empty snapshot.
 *
 * `ViewCart` mounts only once there is something in the bag. It reports once
 * per mount, so mounting it unconditionally would spend that single report on
 * an empty payload and never fire again with the real items.
 */
export default function LocalCartView() {
  const { cart } = useLocalCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="py-12">
        <div className="content-container">
          <div className="h-[420px] animate-pulse bg-cream-200/50" />
        </div>
      </div>
    )
  }

  return (
    <>
      {!!cart?.items?.length && (
        <ViewCart items={lineItemsToGaItems(cart.items)} />
      )}
      <CartTemplate cart={cart} />
    </>
  )
}
