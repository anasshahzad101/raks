"use client"

import { HttpTypes } from "@medusajs/types"
import { shippingFor } from "@lib/shipping"
import { useMemo, useSyncExternalStore } from "react"

/**
 * Browser-side shopping cart.
 *
 * raks.pk is deployed without a Medusa backend, so every `/store/carts` request
 * had nothing to answer it and the whole cart flow failed silently. This keeps
 * the cart in localStorage instead, and shapes it like a `StoreCart` so the
 * existing cart UI renders it without modification. Orders are emailed rather
 * than written to Medusa — see `app/api/orders/route.ts`.
 *
 * Line prices are stored for display only. The order endpoint recomputes every
 * price from the catalog snapshot before emailing, so an edited localStorage
 * cannot dictate what an order costs.
 */

const STORAGE_KEY = "raks_cart_v1"
const CHANGE_EVENT = "raks:cart-change"

export const LOCAL_CART_CURRENCY = "pkr"

export type LocalCartItem = {
  variant_id: string
  product_id: string
  product_handle: string
  product_title: string
  variant_title: string
  thumbnail: string | null
  unit_price: number
  quantity: number
  added_at: string
}

/** Stable identity for the empty case: useSyncExternalStore loops on a new []. */
const EMPTY: LocalCartItem[] = []

/**
 * Cached parse of the stored cart.
 *
 * useSyncExternalStore compares snapshots by reference, so re-parsing the JSON
 * on every read would report an endless stream of changes.
 */
let cache: LocalCartItem[] | null = null

function read(): LocalCartItem[] {
  if (cache) return cache
  if (typeof window === "undefined") return EMPTY

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    cache = Array.isArray(parsed) && parsed.length ? parsed : EMPTY
  } catch {
    // Corrupt JSON or storage blocked: start from an empty bag rather than
    // breaking every page that shows a cart count.
    cache = EMPTY
  }

  return cache
}

function write(items: LocalCartItem[]): void {
  cache = items.length ? items : EMPTY

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Private mode: the cart still works for this page view, in memory.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return
    // Another tab wrote: drop the cache so the next read re-parses.
    cache = null
    onChange()
  }

  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onStorage)
  }
}

/** The server has no cart; rendering empty keeps hydration consistent. */
function serverSnapshot(): LocalCartItem[] {
  return EMPTY
}

export function addLocalCartItem(
  item: Omit<LocalCartItem, "quantity" | "added_at">,
  quantity: number
): void {
  const items = read()
  const existing = items.find((i) => i.variant_id === item.variant_id)

  if (existing) {
    write(
      items.map((i) =>
        i.variant_id === item.variant_id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )
    )
    return
  }

  write([
    ...items,
    { ...item, quantity, added_at: new Date().toISOString() },
  ])
}

export function updateLocalCartQuantity(
  variantId: string,
  quantity: number
): void {
  if (quantity < 1) {
    removeLocalCartItem(variantId)
    return
  }

  write(
    read().map((i) => (i.variant_id === variantId ? { ...i, quantity } : i))
  )
}

export function removeLocalCartItem(variantId: string): void {
  write(read().filter((i) => i.variant_id !== variantId))
}

export function clearLocalCart(): void {
  write([])
}

/** Items currently stored, outside React (for one-shot reads on submit). */
export function readLocalCart(): LocalCartItem[] {
  return read()
}

export function localCartCount(items: LocalCartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

export function localCartTotal(items: LocalCartItem[]): number {
  return items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
}

/**
 * Shape the stored items like a `StoreCart`.
 *
 * The cart UI is written against Medusa's types; matching the shape here means
 * the templates, line-item rows, price formatting and totals all keep working.
 * Fields Medusa would compute server-side (tax, shipping, discounts) are zero:
 * this store is flat-priced with cash on delivery.
 */
export function toStoreCart(items: LocalCartItem[]): HttpTypes.StoreCart | null {
  if (!items.length) return null

  const lineItems = items.map((item) => {
    const total = item.unit_price * item.quantity

    return {
      id: item.variant_id,
      cart_id: "local_cart",
      // The bag dropdown headlines `title` while the cart page headlines
      // `product_title`; both must read as the product, with the variant shown
      // separately underneath.
      title: item.product_title,
      subtitle: item.variant_title,
      thumbnail: item.thumbnail,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_id: item.product_id,
      product_handle: item.product_handle,
      product_title: item.product_title,
      variant_id: item.variant_id,
      variant_title: item.variant_title,
      variant: {
        id: item.variant_id,
        title: item.variant_title,
        product: { images: [] },
      },
      // Equal totals: LineItemPrice strikes through the original only when the
      // current price is lower, and nothing here is discounted.
      total,
      original_total: total,
      subtotal: total,
      discount_total: 0,
      tax_total: 0,
      created_at: item.added_at,
    }
  })

  const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0)
  // Quoted here with the same rule the order endpoint applies server-side, so
  // the bag, the checkout summary and the emailed order cannot disagree.
  const shipping = shippingFor(subtotal)

  return {
    id: "local_cart",
    currency_code: LOCAL_CART_CURRENCY,
    region: {
      id: "local_region",
      name: "Pakistan",
      currency_code: LOCAL_CART_CURRENCY,
    },
    items: lineItems,
    subtotal,
    item_subtotal: subtotal,
    item_total: subtotal,
    shipping_subtotal: shipping,
    shipping_total: shipping,
    discount_subtotal: 0,
    discount_total: 0,
    tax_total: 0,
    total: subtotal + shipping,
    shipping_methods: [],
    promotions: [],
    email: null,
    shipping_address: null,
    billing_address: null,
  } as unknown as HttpTypes.StoreCart
}

/** Subscribe a component to the stored cart. */
export function useLocalCart() {
  const items = useSyncExternalStore(subscribe, read, serverSnapshot)

  const cart = useMemo(() => toStoreCart(items), [items])
  const count = useMemo(() => localCartCount(items), [items])

  return { items, cart, count }
}
