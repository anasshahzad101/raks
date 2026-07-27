/**
 * Shared Medusa `fields` selections for product fetches.
 *
 * Size/Cup option data is heavy across many products, so it is deliberately NOT
 * in the default `listProducts` fields. Request these explicitly only where
 * variant options are needed:
 *  - PDP (single product, variant selector) → PRODUCT_OPTION_FIELDS
 *  - Category page (client size filter) → CATEGORY_PRODUCT_FIELDS (drops
 *    per-variant images to keep the 100-product payload small)
 *
 * Kept out of `lib/data/products.ts` because that file is a "use server"
 * module, which may only export async functions — not constants.
 */
export const PRODUCT_OPTION_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,*categories,*options,*variants.options"

export const CATEGORY_PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,*categories,*images,*options,*variants.options"
