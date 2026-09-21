import "server-only"

import { sdk } from "@lib/config"
import { CatalogVariant, findCatalogVariant } from "@lib/catalog-snapshot"
import { getRegion } from "@lib/data/regions"
import { USE_CATALOG_SNAPSHOT } from "@lib/catalog-mode"

/**
 * Authoritative price lookup for the email order endpoint.
 *
 * The cart lives in localStorage, so nothing the browser posts about a price is
 * trusted — every line is rebuilt from the catalogue server-side. Which
 * catalogue that is depends on how the storefront is deployed:
 *
 *   snapshot mode — the committed JSON is the catalogue, so read it directly.
 *   live mode     — Medusa is the catalogue, and the JSON on disk is whatever
 *                   was true when it was last exported. Reading it here would
 *                   price orders from stale data while the product pages showed
 *                   current prices, so a price raised in the admin would still
 *                   sell at the old one.
 *
 * The mode itself comes from `lib/catalog-mode.ts`, so this and `lib/config.ts`
 * resolve it from one place and cannot disagree about which is authoritative.
 */

type StoreVariantResponse = {
  variant?: {
    id?: string
    title?: string
    sku?: string | null
    thumbnail?: string | null
    product_id?: string
    calculated_price?: { calculated_amount?: number }
    product?: { title?: string; handle?: string; thumbnail?: string | null }
  }
}

/**
 * Resolve a variant to its current price.
 *
 * Returns undefined for anything that cannot be priced with confidence — an
 * unknown variant, an unreachable backend, a variant with no price in the
 * region. The caller rejects the line rather than guessing, because the failure
 * we are avoiding is charging the wrong amount, not showing an error.
 */
export async function resolveVariant(
  variantId: string
): Promise<CatalogVariant | undefined> {
  if (USE_CATALOG_SNAPSHOT) {
    return findCatalogVariant(variantId)
  }

  const region = await getRegion()
  if (!region?.id) return undefined

  let variant: StoreVariantResponse["variant"]

  try {
    // no-store on purpose: a cached price is a wrong price the moment someone
    // edits it in the admin, and this is the number the customer is charged.
    const res = await sdk.client.fetch<StoreVariantResponse>(
      `/store/product-variants/${encodeURIComponent(variantId)}`,
      {
        method: "GET",
        query: {
          region_id: region.id,
          fields:
            "id,title,sku,thumbnail,product_id,*calculated_price,product.title,product.handle,product.thumbnail",
        },
        cache: "no-store",
      }
    )
    variant = res?.variant
  } catch {
    return undefined
  }

  const amount = variant?.calculated_price?.calculated_amount
  if (!variant?.id || typeof amount !== "number") return undefined

  return {
    variant_id: variant.id,
    product_id: variant.product_id ?? "",
    product_handle: variant.product?.handle ?? "",
    product_title: variant.product?.title ?? "",
    variant_title: variant.title ?? "",
    variant_sku: variant.sku ?? null,
    thumbnail: variant.thumbnail ?? variant.product?.thumbnail ?? null,
    unit_price: amount,
  }
}
