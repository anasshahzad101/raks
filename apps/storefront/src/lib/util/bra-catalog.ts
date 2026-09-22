import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { categoryPath, getCategoryByHandle, listCategories } from "@lib/data/categories"
import { CATEGORY_PRODUCT_FIELDS } from "@lib/util/product-fields"
import { buildSizeLookup, slimProductForCard } from "@lib/util/slim-product"
import { HttpTypes } from "@medusajs/types"
import type { SizeLookup } from "@lib/util/slim-product"

/**
 * Everything `BraSizeCalculator` needs, fetched and trimmed on the server.
 *
 * Shared because the calculator renders in two places — its own page and,
 * embedded, inside the older blog post that used to carry a hand-written one.
 * Both must show the same bras in the same sizes, and duplicating the query was
 * the obvious way for them to drift apart.
 */
export type BraSizeCatalog = {
  products: HttpTypes.StoreProduct[]
  sizesByProduct: SizeLookup
  region: HttpTypes.StoreRegion | undefined
  braCategoryPath: string
}

export async function loadBraSizeCatalog(): Promise<BraSizeCatalog> {
  const region = await getRegion("pk")

  // Bras only, filtered server-side by category.
  //
  // Nightwear is also listed in 32-38, but those numbers describe a garment's
  // bust measurement rather than a bra band, so matching a calculated band
  // against them would offer a nightdress as a bra in the shopper's size.
  //
  // The filter is a category query rather than a fetch-everything-then-filter,
  // because the latter silently loses bras: asking for the whole catalogue caps
  // at `limit`, and anything past it never reaches the matcher. That is not
  // hypothetical — at limit 200 against 207 products, three bras stocking the
  // test size were missing from the results with nothing to show it.
  const categories = await listCategories()
  const braCategoryIds = categories
    .filter((c) => /bra/i.test(c.name ?? ""))
    .map((c) => c.id)

  const { response } = await listProducts({
    countryCode: "pk",
    queryParams: {
      category_id: braCategoryIds,
      limit: 250,
      fields: CATEGORY_PRODUCT_FIELDS,
    } as any,
  })

  // Sizes are computed here, while the option graph is still on the server, and
  // passed down as a plain lookup — see the note in `slim-product.ts`.
  const sizesByProduct = buildSizeLookup(response.products)
  const products = response.products
    .filter((p) => (sizesByProduct[p.id] ?? []).length > 0)
    .map(slimProductForCard)

  // Resolved rather than hardcoded: if the category is ever renamed this falls
  // back to the shop instead of shipping a 404 from every "browse all" link.
  const braCategory = await getCategoryByHandle(["lingerie", "bras"]).catch(
    () => null
  )

  return {
    products,
    sizesByProduct,
    region: region ?? undefined,
    braCategoryPath: braCategory ? categoryPath(braCategory) : "/shop/",
  }
}
