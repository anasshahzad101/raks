"use client"

import {
  GA_CURRENCY,
  GaItem,
  itemsValue,
  trackEvent,
} from "@lib/analytics"
import {
  metaContentPayload,
  trackMetaCustom,
  trackMetaEvent,
} from "@lib/meta-pixel"
import { useEffect, useRef } from "react"

/**
 * Ecommerce trackers — GA4 and the Meta Pixel.
 *
 * Server components compute the item payload (they already have the product
 * data and prices) and render one of these to emit the event on the client.
 * Each view tracker fires once per payload, guarded against React strict-mode
 * double-invocation and re-renders.
 *
 * Both destinations are reported from the same guard so they can never
 * disagree: one add to bag is one `add_to_cart` and one `AddToCart`, off the
 * same items and the same value.
 */

/** `view_item` / `ViewContent` — a product detail page was viewed. */
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

    trackMetaEvent(
      "ViewContent",
      metaContentPayload([item], {
        content_name: item.item_name,
        content_category: item.item_category,
      })
    )
  }, [item])

  return null
}

/**
 * `view_item_list` / `ViewCategory` — a category, collection, search or rail
 * was viewed.
 *
 * Meta has no standard event for a listing page, so this is a custom one —
 * the same name and shape the official Facebook commerce plugins use, which
 * keeps it usable as a retargeting audience ("viewed Bras, never bought").
 */
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

    trackMetaCustom("ViewCategory", {
      content_type: "product_group",
      content_ids: items.map((item) => item.item_id),
      content_name: listName,
      content_category: listName,
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

/**
 * `view_cart` / `ViewCart` — the cart page was opened.
 *
 * Custom on the Meta side (there is no standard cart-view event), and the
 * highest-intent audience short of checkout: everyone here has a bag.
 */
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

    trackMetaCustom("ViewCart", metaContentPayload(items))
  }, [items])

  return null
}

/** `begin_checkout` / `InitiateCheckout` — the checkout flow was entered. */
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

    trackMetaEvent("InitiateCheckout", metaContentPayload(items))
  }, [items])

  return null
}

/**
 * `purchase` / `Purchase` — an order was placed. The conversion event.
 *
 * Rendered by the order confirmation page. Deduplicated by order id in
 * sessionStorage on top of the usual ref guard: the confirmation URL is
 * stable and survives a reload, a bookmark or a back-navigation, and GA4 and
 * Meta would otherwise count the same order as revenue again on every view.
 * Both reports sit inside that guard, so they always agree.
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

    const key = `purchase_reported_${transactionId}`
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

    // `value` and `currency` come from the order, not the lines, so they carry
    // delivery and tax — this is the number Meta optimises and reports ROAS on.
    // The event id is the order reference, which is what a Conversions API
    // send would use to deduplicate against this browser event.
    trackMetaEvent(
      "Purchase",
      metaContentPayload(items, {
        value,
        currency,
        order_id: transactionId,
      }),
      `purchase-${transactionId}`
    )
  }, [transactionId, items, value, currency, tax, shipping])

  return null
}
