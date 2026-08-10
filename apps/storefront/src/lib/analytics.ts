/**
 * Google Analytics 4 helpers.
 *
 * The measurement ID is baked in as a default because it is a public identifier
 * and the site is deployed on a host where setting env vars is awkward; set
 * NEXT_PUBLIC_GA_ID to override it (e.g. to a test property).
 *
 * Every helper is a no-op until gtag.js has loaded, and on the server, so
 * callers never need to guard.
 */
import { HttpTypes } from "@medusajs/types"

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID || "G-RJSN26X9VW"

export const GA_CURRENCY = "PKR"

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

/** A GA4 ecommerce item. */
export type GaItem = {
  item_id: string
  item_name: string
  item_brand?: string
  item_category?: string
  item_variant?: string
  price?: number
  quantity?: number
  index?: number
}

/**
 * Ensure a gtag queue exists, defining the standard stub if gtag.js has not
 * loaded yet.
 *
 * Components fire events from `useEffect`, which runs before an
 * `afterInteractive` script has executed. Without this, early events — notably
 * `view_item` on a product page — were dropped silently. The stub pushes to
 * `dataLayer`, and gtag.js replays the queue once it loads.
 */
function gtag(...args: any[]): void {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer || []

  if (typeof window.gtag !== "function") {
    window.gtag = function gtagStub() {
      // Must push `arguments` itself: gtag.js expects arguments objects.
      window.dataLayer!.push(arguments)
    }
  }

  window.gtag!(...args)
}

/** Send a GA4 event. Queues if gtag.js has not finished loading. */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {}
): void {
  gtag("event", name, params)
}

/** Send a page_view. Needed explicitly because the App Router never reloads. */
export function trackPageView(url: string, title?: string): void {
  if (typeof window === "undefined") return

  gtag("event", "page_view", {
    page_path: url,
    page_location: window.location.href,
    page_title: title ?? document.title,
  })
}

/** Lowest resolvable price across a product's variants, or undefined. */
function cheapestAmount(product: HttpTypes.StoreProduct): number | undefined {
  const amounts = (product.variants ?? [])
    .map((v: any) => v?.calculated_price?.calculated_amount)
    .filter((n: unknown): n is number => typeof n === "number")

  return amounts.length ? Math.min(...amounts) : undefined
}

/** Map a Medusa product to a GA4 ecommerce item. */
export function toGaItem(
  product: HttpTypes.StoreProduct,
  extra: Partial<GaItem> = {}
): GaItem {
  return {
    item_id: product.handle || product.id || "",
    item_name: product.title || "",
    item_brand: "Raks",
    item_category: product.categories?.[0]?.name,
    price: cheapestAmount(product),
    quantity: 1,
    ...extra,
  }
}

/** Map several products, preserving list position (GA uses `index` for CTR). */
export function toGaItems(
  products: HttpTypes.StoreProduct[],
  extra: Partial<GaItem> = {}
): GaItem[] {
  return products.map((product, i) => toGaItem(product, { index: i, ...extra }))
}

/** Total value of a set of items, for events that report a monetary value. */
export function itemsValue(items: GaItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
    0
  )
}
