/**
 * Google Analytics 4 events for the shopping assistant.
 *
 * Two rules govern everything here.
 *
 * 1. No personal data leaves the browser. Shoppers give the assistant their
 *    name and mobile number, and Google's own terms forbid sending either to
 *    Analytics. Contact events therefore record only that a step happened, and
 *    any free text that is reported passes through `scrub()` first.
 *
 * 2. Adding to the bag from the assistant fires the standard `add_to_cart`, not
 *    a custom event, so assistant-driven sales appear in the normal GA4
 *    ecommerce reports alongside every other route into the bag. The
 *    `item_list_name` is what separates them.
 */
import { GA_CURRENCY, trackEvent } from "@lib/analytics"

/** Marks assistant-sourced items in the standard ecommerce reports. */
export const ASSISTANT_LIST = "shopping_assistant"

/**
 * Remove anything that could identify a person from a typed message.
 *
 * Shoppers type unpredictable things. A message like "call me on 0300 1234567"
 * is a realistic input, so digits runs and email addresses are stripped rather
 * than trusted. The result is truncated because GA4 rejects long values and a
 * search phrase is not useful past a few words.
 */
export const scrub = (text: string): string =>
  String(text ?? "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(?:\+?92|0)?\d[\d\s-]{7,}\d/g, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)

type Facets = {
  cats?: string[]
  occasion?: string
  fabric?: string
  max?: number
  size?: string
  color?: string
}

/** Flatten a filter into GA4-safe scalar params. */
const facetParams = (f: Facets = {}) => ({
  assistant_category: f.cats?.length ? f.cats.join("|").slice(0, 100) : undefined,
  assistant_occasion: f.occasion || undefined,
  assistant_fabric: f.fabric || undefined,
  assistant_size: f.size || undefined,
  assistant_colour: f.color || undefined,
  // Infinity is not valid JSON, so "any" stands in for no budget cap.
  assistant_budget:
    f.max === undefined || f.max === Infinity ? "any" : String(f.max),
})

/** The greeting bubble appeared by itself. */
export const trackTeaserShown = () => trackEvent("assistant_teaser_shown")

export const trackTeaserDismissed = () =>
  trackEvent("assistant_teaser_dismissed")

/** `source` distinguishes the auto greeting from the launcher button. */
export const trackOpen = (source: "teaser" | "button") =>
  trackEvent("assistant_open", { assistant_source: source })

export const trackClose = (messages: number) =>
  trackEvent("assistant_close", { assistant_messages: messages })

/** A guided button was tapped. */
export const trackChoice = (step: string, label: string) =>
  trackEvent("assistant_choice", {
    assistant_step: step,
    assistant_choice: label.slice(0, 80),
  })

/**
 * A typed message. The raw phrase is reported only for product searches and for
 * messages the assistant failed to understand, because those are the two cases
 * where knowing the wording is worth anything: one shows demand, the other
 * shows a gap in the parser. It is scrubbed either way.
 */
export const trackMessage = (intent: string, text: string) =>
  trackEvent("assistant_message", {
    assistant_intent: intent,
    assistant_query:
      intent === "search" || intent === "unknown" ? scrub(text) : undefined,
  })

export const trackFaq = (topic: string) =>
  trackEvent("assistant_faq", { assistant_topic: topic })

export const trackResults = (count: number, f: Facets) =>
  trackEvent("assistant_results", { assistant_results: count, ...facetParams(f) })

/** No match. The most actionable event here: demand the catalogue cannot meet. */
export const trackNoResults = (f: Facets) =>
  trackEvent("assistant_no_results", facetParams(f))

/** A person was asked for. */
export const trackHandoff = (channel: "requested" | "whatsapp") =>
  trackEvent("assistant_handoff", { assistant_channel: channel })

/**
 * Contact capture. Deliberately carries no name and no number — only the fact
 * that the shopper reached this step, so the funnel is measurable without
 * putting personal data in Analytics.
 */
export const trackContact = (stage: "asked" | "saved" | "invalid_phone") =>
  trackEvent("assistant_contact", { assistant_stage: stage })

/** Standard ecommerce add_to_cart, tagged as assistant-sourced. */
export const trackAssistantAddToCart = (item: {
  item_id: string
  item_name: string
  price: number
  item_variant?: string
}) =>
  trackEvent("add_to_cart", {
    currency: GA_CURRENCY,
    value: item.price,
    items: [{ ...item, item_brand: "Raks", item_list_name: ASSISTANT_LIST, quantity: 1 }],
  })

/** Standard select_item, so click-through from the assistant is attributable. */
export const trackAssistantSelectItem = (item: {
  item_id: string
  item_name: string
  price: number
  index: number
}) =>
  trackEvent("select_item", {
    item_list_name: ASSISTANT_LIST,
    items: [{ ...item, item_brand: "Raks" }],
  })
