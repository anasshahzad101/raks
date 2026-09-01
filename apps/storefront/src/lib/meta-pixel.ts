/**
 * Meta (Facebook) Pixel helpers.
 *
 * The pixel/dataset ID is baked in as a default because it is a public
 * identifier and the site is deployed on a host where setting env vars is
 * awkward; set NEXT_PUBLIC_FB_PIXEL_ID to override it (e.g. to a test pixel).
 *
 * Items are described with the same `GaItem` shape the GA4 helpers already
 * produce, so one call site reports one event to both destinations and the two
 * reports can be reconciled. `content_ids` are therefore product handles — the
 * same identity GA uses — which means a product catalogue uploaded to Meta
 * must key its items on the handle for catalogue matching (dynamic ads,
 * advantage+) to line up.
 *
 * Every helper is a no-op on the server and queues in the browser until
 * fbevents.js has loaded, so callers never need to guard.
 */
import { GA_CURRENCY, GaItem, itemsValue } from "@lib/analytics"

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_FB_PIXEL_ID || "1076085052474317"

export const META_CURRENCY = GA_CURRENCY

export const META_SCRIPT_URL = "https://connect.facebook.net/en_US/fbevents.js"

type FbqFn = ((...args: any[]) => void) & {
  callMethod?: (...args: any[]) => void
  queue?: any[]
  loaded?: boolean
  version?: string
  push?: unknown
}

declare global {
  interface Window {
    fbq?: FbqFn
    _fbq?: FbqFn
  }
}

let initialised = false

/**
 * Call fbq, standing up the queue stub and initialising the pixel if needed.
 *
 * This is the base code from Events Manager minus the script injection, which
 * next/script owns. Two details matter:
 *
 * - Components fire events from `useEffect`, which runs before an
 *   `afterInteractive` script has executed. Without the stub those events —
 *   notably ViewContent on a product page — would be dropped silently.
 * - `init` is issued here rather than from an inline script so it is always
 *   the first entry in the queue. fbevents.js replays the queue in order and
 *   discards any track that arrives before the pixel is initialised.
 */
function fbq(...args: any[]): void {
  if (typeof window === "undefined" || !META_PIXEL_ID) return

  if (typeof window.fbq !== "function") {
    const stub: FbqFn = function fbqStub(...queued: any[]) {
      if (stub.callMethod) {
        stub.callMethod.apply(stub, queued)
      } else {
        stub.queue!.push(queued)
      }
    } as FbqFn

    stub.queue = []
    stub.loaded = true
    stub.version = "2.0"
    stub.push = stub

    window.fbq = stub
    window._fbq = window._fbq || stub
  }

  if (!initialised) {
    initialised = true
    window.fbq!("init", META_PIXEL_ID)
  }

  window.fbq!(...args)
}

/**
 * Send a Meta standard event.
 *
 * `eventId` is echoed as `eventID`, which is how Meta deduplicates a browser
 * event against the same event sent server-side by the Conversions API. It
 * costs nothing to send now and is what makes adding CAPI later a
 * configuration change rather than a re-instrumentation.
 */
export function trackMetaEvent(
  name: string,
  params: Record<string, unknown> = {},
  eventId?: string
): void {
  if (eventId) {
    fbq("track", name, params, { eventID: eventId })
    return
  }

  fbq("track", name, params)
}

/** Send a Meta custom event — for funnel steps with no standard equivalent. */
export function trackMetaCustom(
  name: string,
  params: Record<string, unknown> = {}
): void {
  fbq("trackCustom", name, params)
}

/** PageView. Sent explicitly because the App Router never reloads the document. */
export function trackMetaPageView(): void {
  fbq("track", "PageView")
}

/** A line in Meta's `contents` array. */
export type MetaContent = {
  id: string
  quantity: number
  item_price?: number
}

export function toMetaContents(items: GaItem[]): MetaContent[] {
  return items.map((item) => ({
    id: item.item_id,
    quantity: item.quantity ?? 1,
    ...(item.price !== undefined ? { item_price: item.price } : {}),
  }))
}

/**
 * The payload every commerce event shares: ids, per-line detail and value.
 *
 * Meta wants both `content_ids` (matching) and `contents` (quantity + price),
 * so both are sent rather than picking one. `value` is the sum of the lines;
 * events that know a truer total (Purchase, which includes delivery) override
 * it by spreading their own value afterwards.
 */
export function metaContentPayload(
  items: GaItem[],
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const contents = toMetaContents(items)

  return {
    content_type: "product",
    content_ids: contents.map((content) => content.id),
    contents,
    num_items: contents.reduce((total, content) => total + content.quantity, 0),
    value: itemsValue(items),
    currency: META_CURRENCY,
    ...extra,
  }
}
