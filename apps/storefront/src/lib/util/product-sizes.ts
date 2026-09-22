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

/** Band numbers Raks uses on bras. Matches STOCKED_BANDS in `bra-size.ts`. */
const BRA_BANDS = /^(3[02468]|4[0246])$/

/**
 * Whether the bra size calculator can honestly answer for this product.
 *
 * The calculator returns a band and a cup (32A-46G). A nightdress sold in S/M/L,
 * or in a bust measurement that happens to be a number, cannot be mapped to that
 * from two tape readings — so offering it there would hand someone a bra size
 * and let them assume it is their nightdress size.
 *
 * Two cases qualify:
 *  - the product has a Cup Size option, which is unambiguous bra sizing; or
 *  - it sits in a bra category and its sizes are bands (34, 36, 38...), which is
 *    a bra sold without a separate cup. The category check is what keeps
 *    nightwear out: plenty of it is also listed in 32-38, but those numbers
 *    describe the garment's bust, not a band.
 */
export function isBraSized(product: HttpTypes.StoreProduct): boolean {
  const options = product.options ?? []
  if (options.some((o) => /cup/i.test(o.title ?? ""))) return true

  const inBraCategory = (product.categories ?? []).some((c) =>
    /bra/i.test(c.name ?? "")
  )
  if (!inBraCategory) return false

  return options.some(
    (o) =>
      /size/i.test(o.title ?? "") &&
      (o.values ?? []).some((v) => BRA_BANDS.test((v.value ?? "").trim()))
  )
}

/**
 * The option ids that make up a product's size label, in the order
 * `getProductSizes` joins them (band first, cup last).
 *
 * Exported so a caller holding a label like "34C" can work back to the option
 * values that produce it, without re-deriving the ordering rule and drifting
 * out of step with `getProductSizes`.
 */
export function getSizeOptionIds(product: HttpTypes.StoreProduct): string[] {
  return (product.options ?? [])
    .filter((o) => /size/i.test(o.title ?? ""))
    .sort(
      (a, b) =>
        (/cup/i.test(a.title ?? "") ? 1 : 0) - (/cup/i.test(b.title ?? "") ? 1 : 0)
    )
    .map((o) => o.id)
}

/**
 * The option values that produce a given size label on this product.
 *
 * Returns null when no variant carries that label. Only the size options are
 * returned — colour is deliberately left alone, so picking "34C" on a bra that
 * comes in three colours does not silently choose one of them too.
 */
export function optionValuesForSize(
  product: HttpTypes.StoreProduct,
  label: string
): Record<string, string> | null {
  const optionIds = getSizeOptionIds(product)
  if (!optionIds.length) return null

  for (const variant of product.variants ?? []) {
    const vopts = ((variant as any).options ?? []) as {
      option_id?: string
      value?: string
    }[]
    const parts = optionIds.map(
      (id) => vopts.find((vo) => vo.option_id === id)?.value
    )
    if (parts.some((v) => !v)) continue
    if (parts.join("") !== label) continue

    const out: Record<string, string> = {}
    optionIds.forEach((id, i) => {
      out[id] = parts[i] as string
    })
    return out
  }
  return null
}
