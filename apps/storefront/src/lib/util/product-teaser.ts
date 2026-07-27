import { HttpTypes } from "@medusajs/types"

/**
 * A short one-line teaser shown under the price on the product page (the
 * reference's "A nightwear essential — silk & net…" line). Prefers a real
 * product subtitle; otherwise picks a category-appropriate sentence so every
 * product reads well even before its full description loads.
 */
export function getProductTeaser(product: HttpTypes.StoreProduct): string {
  const subtitle = (product.subtitle ?? "").trim()
  if (subtitle) return subtitle

  const cats = (product.categories ?? []).map((c) => (c.name ?? "").toLowerCase())
  const has = (k: string) => cats.some((c) => c.includes(k))

  if (has("bridal"))
    return "Made for your most special moments — delicate detailing with a comfortable, true-to-size fit."
  if (has("sports"))
    return "Secure, breathable support that moves with you — made for everyday and active wear."
  if (has("nursing") || has("maternity"))
    return "Soft, supportive and easy to wear — designed with new mums in mind."
  if (has("bra"))
    return "Everyday support with a smooth, flattering shape and a true-to-size fit."
  if (has("panties") || has("knicker"))
    return "Soft, breathable and made to be lived in — an easy everyday essential."
  if (has("shapewear") || has("shaper"))
    return "Smooth, confident shaping under everything you love to wear."
  if (has("pyjama") || has("pajama") || has("night suit"))
    return "Cosy, breathable loungewear made for easy, restful nights."
  if (
    has("nightgown") ||
    has("nighty") ||
    has("nightdress") ||
    has("nightwear") ||
    has("gown")
  )
    return "A nightwear essential — soft against the skin with a relaxed, flattering drape."

  return "Soft, premium and made to be lived in — finished to the quality RAKS is loved for."
}
