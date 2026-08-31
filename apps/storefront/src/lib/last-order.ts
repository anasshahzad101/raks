"use client"

/**
 * Hand-off of a just-placed order to the confirmation page.
 *
 * There is no backend to fetch an order back from, so the checkout stashes the
 * server's response here and the thank-you page reads it. sessionStorage rather
 * than a query string: the payload carries prices and item details that have no
 * business sitting in a URL, in browser history or in a Referer header.
 *
 * Every value here comes from the order endpoint, never from the cart, so the
 * totals shown and reported to Analytics are the ones actually charged.
 */

const LAST_ORDER_KEY = "raks_last_order"

export type PlacedOrderItem = {
  handle: string
  product_title: string
  variant_title: string
  sku: string | null
  quantity: number
  unit_price: number
}

export type PlacedOrder = {
  reference: string
  subtotal: number
  shipping: number
  total: number
  currency: string
  items: PlacedOrderItem[]
}

export function saveLastOrder(order: PlacedOrder): void {
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
  } catch {
    // Storage blocked: the thank-you page falls back to a generic message.
  }
}

export function readLastOrder(): PlacedOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed?.reference ? (parsed as PlacedOrder) : null
  } catch {
    return null
  }
}
