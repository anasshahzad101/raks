import { HttpTypes } from "@medusajs/types"

/**
 * The distinct size labels available across a product's variants.
 *
 * Raks models bra sizing as two separate options — a band ("Size", e.g. 32–46)
 * and a "Cup Size" (A–F). We combine them per variant into a single swatch
 * ("32A", "34C"), band first, cup last, matching the reference design. Products
 * with a single size option (S/M/L nightwear etc.) return those values as-is.
 * Returns [] when the product has no size-like option.
 */
export function getProductSizes(product: HttpTypes.StoreProduct): string[] {
  const sizeOptions = (product.options ?? [])
    .filter((o) => /size/i.test(o.title ?? ""))
    // Cup options come after band/numeric ones so labels read "32A", not "A32".
    .sort(
      (a, b) =>
        (/cup/i.test(a.title ?? "") ? 1 : 0) - (/cup/i.test(b.title ?? "") ? 1 : 0)
    )
  if (!sizeOptions.length) return []

  const optionIds = sizeOptions.map((o) => o.id)

  const labels = new Set<string>()
  for (const variant of product.variants ?? []) {
    const vopts = ((variant as any).options ?? []) as {
      option_id?: string
      value?: string
    }[]
    const parts = optionIds
      .map((id) => vopts.find((vo) => vo.option_id === id)?.value)
      .filter((v): v is string => Boolean(v))
    if (parts.length) labels.add(parts.join(""))
  }
  return [...labels]
}

const LETTER_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "4XL"]

function sizeRank(size: string): number {
  const u = size.trim().toUpperCase()
  const letter = LETTER_ORDER.indexOf(u)
  if (letter !== -1) return 100 + letter
  // Bra sizes like "32A", "34C" — order by band number, cup breaks ties below.
  const band = parseInt(u, 10)
  if (!Number.isNaN(band)) return 1000 + band
  return 5000
}

/** Sort sizes into a human order: letters (XS→XXL), then bra bands ascending. */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(
    (a, b) =>
      sizeRank(a) - sizeRank(b) ||
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  )
}
