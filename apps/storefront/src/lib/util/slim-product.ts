import { HttpTypes } from "@medusajs/types"
import { getProductSizes } from "./product-sizes"

/**
 * Trim a product down to what a product card actually renders, before it is
 * handed to a client component.
 *
 * A category page passes its products to `CategoryBrowser`, which is a client
 * component, so every field crosses into the RSC payload and ships to the
 * browser. The full `StoreProduct` carries an `options` array and, on each
 * variant, another `options` array where every entry re-embeds the whole parent
 * option object with its ids and timestamps. For a 13-product category that was
 * roughly a megabyte of JSON inside `<script>` tags, for data the card never
 * reads.
 *
 * The only client-side consumer of those option arrays was the size filter, so
 * sizes are computed here on the server and passed as a plain lookup instead.
 *
 * Anything the card does read is kept: title, handle, thumbnail, first image,
 * categories, tags, metadata, created_at, and the calculated price that
 * `getProductPrice` needs.
 */

export type SizeLookup = Record<string, string[]>

/**
 * Keep only the fields a card reads, as an allowlist.
 *
 * An earlier version spread the product and deleted a few keys, which still
 * shipped every product `description`, the full `categories` objects with their
 * parent chains and timestamps, and per-variant `weight`, `width`, `height` and
 * `material`. Listing what to keep is the only version that stays correct as
 * Medusa's payload grows.
 */
export const slimProductForCard = (
  product: HttpTypes.StoreProduct
): HttpTypes.StoreProduct => {
  const p = product as any
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    thumbnail: p.thumbnail,
    created_at: p.created_at,
    // The card renders one image; the gallery lives on the product page.
    images: p.images?.slice(0, 1).map((i: any) => ({ id: i.id, url: i.url })) ?? [],
    // Only the name is read, for the card's category label and bridal badge.
    categories: (p.categories ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
    })),
    // Read for the bridal badge.
    tags: (p.tags ?? []).map((t: any) => ({ id: t.id, value: t.value })),
    // Read only for the `price_missing` flag.
    metadata: p.metadata?.price_missing
      ? { price_missing: p.metadata.price_missing }
      : null,
    // getProductPrice needs the calculated price and nothing else. The raw
    // amount objects and inventory fields Medusa attaches are dropped.
    variants: (p.variants ?? []).map((v: any) => ({
      id: v.id,
      calculated_price: v.calculated_price
        ? {
            calculated_amount: v.calculated_price.calculated_amount,
            original_amount: v.calculated_price.original_amount,
            currency_code: v.calculated_price.currency_code,
            calculated_price: {
              price_list_type:
                v.calculated_price.calculated_price?.price_list_type,
            },
          }
        : undefined,
    })),
  } as unknown as HttpTypes.StoreProduct
}

/** Size labels per product id, computed while the full option data is still here. */
export const buildSizeLookup = (
  products: HttpTypes.StoreProduct[]
): SizeLookup => {
  const lookup: SizeLookup = {}
  for (const product of products) {
    const sizes = getProductSizes(product)
    if (sizes.length) lookup[product.id] = sizes
  }
  return lookup
}
