import { toPlainText } from "./plain-text"

/**
 * Pull a fabric composition out of a migrated product description.
 *
 * The "Fabric & Care" panel used to print the same sentence on all 207 products:
 * "Made from soft, breathable fabrics chosen for all-day comfort." That is an
 * unsupported claim across a catalogue that includes 100% polyester, and it
 * contradicted the descriptions that state a real composition, so one product
 * page asserted two different things about its own fabric.
 *
 * No variant in the catalogue carries Medusa's `material` field, and 32 of the
 * 207 descriptions state a percentage composition in prose. This reads those,
 * and returns null for the rest rather than inventing one. A product with no
 * known composition should say so.
 */

// "85% Polyamide, 15% Elastane", "93% Polyamide / 7% Elastane", "100% Silk"
const COMPOSITION =
  /\d{1,3}\s?%\s?[A-Za-z]{3,15}(?:\s*[,+/&]\s*\d{1,3}\s?%\s?[A-Za-z]{3,15})*/g

/** Fibre names we accept, so "50% off" and "100% Original" are not read as fabric. */
const FIBRES =
  /(cotton|polyester|polyamide|elastane|spandex|nylon|silk|satin|rayon|viscose|modal|linen|lycra|acrylic|wool|bamboo|lace|mesh)/i

const tidy = (s: string) =>
  s
    .replace(/\s*([,+/&])\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/,\s*$/, "")
    .trim()

/**
 * The composition stated in a product description, or null when none is stated.
 * Never guesses.
 */
export const extractComposition = (
  description?: string | null
): string | null => {
  const text = toPlainText(description)
  if (!text) return null

  COMPOSITION.lastIndex = 0
  const matches = text.match(COMPOSITION)
  if (!matches) return null

  for (const raw of matches) {
    const cleaned = tidy(raw)
    // Must name a real fibre, and a lone "100% Original" style phrase is not one.
    if (!FIBRES.test(cleaned)) continue
    // Guard against runaway matches swallowing following prose.
    if (cleaned.length > 60) continue

    // A composition should account for the whole garment. A single component
    // well under 100% means the match clipped the first fibre off, which is
    // how "91% Polyamide, 9% Elastane" once surfaced as just "9% Polyamide".
    const parts = cleaned.split(",").map((s) => s.trim()).filter(Boolean)
    const total = parts.reduce(
      (sum, part) => sum + (parseInt(part, 10) || 0),
      0
    )
    if (total < 90 || total > 110) continue

    return cleaned
  }
  return null
}
