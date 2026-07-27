import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listCategories = async (query?: Record<string, unknown>) => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          // Lightweight: category tree only (no full product payloads), so the
          // response stays well under Next.js' 2MB fetch-cache limit.
          fields:
            "id, name, handle, description, parent_category_id, *category_children, *parent_category, *parent_category.parent_category, *parent_category.parent_category.parent_category",
          limit,
          ...query,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories)
    // Degrade to an empty tree if the backend is offline (frontend-only dev),
    // so the nav and category sidebar render empty instead of throwing.
    .catch(() => [] as HttpTypes.StoreProductCategory[])
}

/**
 * Raks category URLs are hierarchical (e.g. /product-category/lingerie/bras/padded-bra/)
 * but Medusa stores the leaf slug as the handle. We resolve by the LAST segment
 * (handles are unique) and pull the parent chain so breadcrumbs work.
 */
export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = categoryHandle[categoryHandle.length - 1]

  const next = {
    ...(await getCacheOptions("categories")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields:
            "*category_children, *products, *parent_category, *parent_category.parent_category, *parent_category.parent_category.parent_category",
          handle,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories[0])
    // Backend offline → undefined, so callers hit their notFound() path cleanly
    // instead of surfacing an uncaught fetch error.
    .catch(() => undefined)
}

/** Build the hierarchical URL path for a category from its parent chain. */
export const categoryPath = (
  category: HttpTypes.StoreProductCategory
): string => {
  const slugs: string[] = []
  let cur: any = category
  while (cur) {
    if (cur.handle) slugs.unshift(cur.handle)
    cur = cur.parent_category
  }
  return `/product-category/${slugs.join("/")}/`
}
