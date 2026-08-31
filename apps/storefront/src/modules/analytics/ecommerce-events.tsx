"use client"

import {
  GA_CURRENCY,
  GaItem,
  itemsValue,
  trackEvent,
} from "@lib/analytics"
import { useEffect, useRef } from "react"

/**
 * GA4 ecommerce trackers.
 *
 * Server components compute the item payload (they already have the product
 * data and prices) and render one of these to emit the event on the client.
 * Each view tracker fires once per payload, guarded against React strict-mode
 * double-invocation and re-renders.
 */

/** `view_item` — a product detail page was viewed. */
export function ViewItem({ item }: { item: GaItem }) {
  const sent = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (sent.current === item.item_id) return
    sent.current = item.item_id

    trackEvent("view_item", {
      currency: GA_CURRENCY,
      value: item.price ?? 0,
      items: [item],
    })
  }, [item])

  return null
}

/** `view_item_list` — a category, collection, search or rail was viewed. */
export function ViewItemList({
  items,
  listId,
  listName,
}: {
  items: GaItem[]
  listId: string
  listName: string
}) {
  const sent = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!items.length) return

    const key = `${listId}:${items.length}:${items[0]?.item_id ?? ""}`
    if (sent.current === key) return
    sent.current = key

    trackEvent("view_item_list", {
      item_list_id: listId,
      item_list_name: listName,
      items,
    })
  }, [items, listId, listName])

  return null
}

/**
 * `select_item` — wraps a product card so a click is attributed to its list.
 * Renders a plain wrapper so it does not disturb the card's own layout.
 */
export function SelectItem({
  item,
  listId,
  listName,
  children,
}: {
  item: GaItem
  listId?: string
  listName?: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={() =>
        trackEvent("select_item", {
          item_list_id: listId,
          item_list_name: listName,
          items: [item],
        })
      }
    >
      {children}
    </div>
  )
}

/** `view_cart` — the cart page was opened. */
export function ViewCart({ items }: { items: GaItem[] }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    trackEvent("view_cart", {
      currency: GA_CURRENCY,
      value: itemsValue(items),
      items,
    })
  }, [items])

  return null
}

/** `begin_checkout` — the checkout flow was entered. */
export function BeginCheckout({ items }: { items: GaItem[] }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    trackEvent("begin_checkout", {
      currency: GA_CURRENCY,
      value: itemsValue(items),
      items,
    })
  }, [items])

  return null
}

/**
 * `purchase` — an order was placed.
 *
 * Rendered by the order confirmation page. Deduplicated by order id in
 * sessionStorage on top of the usual ref guard: the confirmation URL is
 * stable and survives a reload, a bookmark or a back-navigation, and GA4
 * would otherwise count the same order as revenue again on every view.
 */
export function Purchase({
  transactionId,
  items,
  value,
  currency,
  tax,
  shipping,
}: {
  transactionId: string
  items: GaItem[]
  value: number
  currency: string
  tax?: number
  shipping?: number
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current || !transactionId) return
    sent.current = true

    const key = `ga_purchase_${transactionId}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, "1")
    } catch {
      // Storage blocked (private mode, cookie settings): the ref guard still
      // prevents a double-fire within this page view.
    }

    trackEvent("purchase", {
      transaction_id: transactionId,
      currency,
      value,
      ...(tax !== undefined ? { tax } : {}),
      ...(shipping !== undefined ? { shipping } : {}),
      items,
    })
  }, [transactionId, items, value, currency, tax, shipping])

  return null
}
