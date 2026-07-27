/**
 * Static catalog snapshot — a drop-in stand-in for the Medusa Store API.
 *
 * The storefront normally reads its catalog from Medusa over HTTP. raks.pk is
 * currently deployed without a backend, so `src/lib/config.ts` routes read-only
 * catalog requests here instead, and this module answers them from the JSON
 * exported by `scripts/export-catalog.mjs`.
 *
 * It intentionally mimics the *responses* of the Store API rather than replacing
 * the data layer, so every caller in `src/lib/data/*` keeps working unchanged —
 * including pagination maths, `fields` selections and error handling.
 *
 * Only read-only catalog endpoints are handled. Cart/customer/checkout requests
 * return `undefined` so they fall through to the real (absent) backend and hit
 * their existing `.catch()` paths.
 */
import categoriesJson from "../content/catalog/categories.json"
import collectionsJson from "../content/catalog/collections.json"
import productsJson from "../content/catalog/products.json"
import regionsJson from "../content/catalog/regions.json"

type AnyRecord = Record<string, any>

const products = productsJson as AnyRecord[]
const collections = collectionsJson as AnyRecord[]
const regions = regionsJson as AnyRecord[]

/**
 * Rebuild the full `parent_category` chain.
 *
 * Medusa only expands one level of `parent_category`, however deeply the export
 * asks for it, so depth-3 categories arrive with a parent whose own parent is
 * missing. Consumers that walk `cur.parent_category` (categoryPath(),
 * generateStaticParams(), breadcrumbs) would then emit truncated URLs such as
 * /product-category/bras/padded-bra/ instead of the indexed
 * /product-category/lingerie/bras/padded-bra/.
 *
 * The id graph is intact, so relink the objects by `parent_category_id`. Cloned
 * first so the JSON import is not mutated, and depth-guarded against cycles.
 */
const categories: AnyRecord[] = (() => {
  const list = (categoriesJson as AnyRecord[]).map((c) => ({ ...c }))
  const byId = new Map(list.map((c) => [c.id, c]))

  for (const category of list) {
    let cursor = category
    let depth = 0

    while (cursor?.parent_category_id && depth < 10) {
      const parent = byId.get(cursor.parent_category_id)
      if (!parent) break
      cursor.parent_category = parent
      cursor = parent
      depth++
    }
  }

  return list
})()

/** Normalise a query value that may arrive as a scalar or an array. */
function toArray(value: unknown): string[] {
  if (value === undefined || value === null) return []
  return (Array.isArray(value) ? value : [value]).map(String)
}

/** Medusa `order` syntax: "created_at" ascending, "-created_at" descending. */
function applyOrder(list: AnyRecord[], order?: unknown): AnyRecord[] {
  if (typeof order !== "string" || !order) return list

  const desc = order.startsWith("-")
  const field = desc ? order.slice(1) : order

  return [...list].sort((a, b) => {
    const av = a?.[field]
    const bv = b?.[field]
    if (av === bv) return 0
    if (av === undefined || av === null) return 1
    if (bv === undefined || bv === null) return -1
    const cmp = av < bv ? -1 : 1
    return desc ? -cmp : cmp
  })
}

function filterProducts(query: AnyRecord): AnyRecord[] {
  let list = products

  const handles = toArray(query.handle)
  if (handles.length) {
    list = list.filter((p) => handles.includes(p.handle))
  }

  const ids = toArray(query.id)
  if (ids.length) {
    list = list.filter((p) => ids.includes(p.id))
  }

  const categoryIds = toArray(query.category_id)
  if (categoryIds.length) {
    list = list.filter((p) =>
      (p.categories ?? []).some((c: AnyRecord) => categoryIds.includes(c?.id))
    )
  }

  const collectionIds = toArray(query.collection_id)
  if (collectionIds.length) {
    list = list.filter((p) => collectionIds.includes(p.collection_id))
  }

  const tagIds = toArray(query.tag_id)
  if (tagIds.length) {
    list = list.filter((p) =>
      (p.tags ?? []).some((t: AnyRecord) => tagIds.includes(t?.id))
    )
  }

  if (typeof query.q === "string" && query.q.trim()) {
    const term = query.q.trim().toLowerCase()
    list = list.filter((p) =>
      [p.title, p.subtitle, p.description, p.handle]
        .filter(Boolean)
        .some((field: string) => String(field).toLowerCase().includes(term))
    )
  }

  return applyOrder(list, query.order)
}

/**
 * Answer a Store API request from the snapshot.
 * Returns `undefined` for anything this module does not model.
 */
export function snapshotFetch(
  path: string,
  query: AnyRecord = {}
): unknown | undefined {
  // Strip any query string and normalise trailing slashes.
  const pathname = path.split("?")[0].replace(/\/+$/, "")

  // ---- regions -----------------------------------------------------------
  if (pathname === "/store/regions") {
    return { regions, count: regions.length }
  }

  const regionMatch = pathname.match(/^\/store\/regions\/(.+)$/)
  if (regionMatch) {
    const region =
      regions.find((r) => r.id === regionMatch[1]) ?? regions[0] ?? null
    return { region }
  }

  // ---- products ----------------------------------------------------------
  if (pathname === "/store/products") {
    const matched = filterProducts(query)
    const limit = Number(query.limit ?? 12)
    const offset = Number(query.offset ?? 0)

    return {
      products: matched.slice(offset, offset + limit),
      count: matched.length,
      limit,
      offset,
    }
  }

  const productMatch = pathname.match(/^\/store\/products\/(.+)$/)
  if (productMatch) {
    const id = productMatch[1]
    const product =
      products.find((p) => p.id === id || p.handle === id) ?? null
    return { product }
  }

  // ---- categories --------------------------------------------------------
  if (pathname === "/store/product-categories") {
    let list = categories

    const handles = toArray(query.handle)
    if (handles.length) {
      list = list.filter((c) => handles.includes(c.handle))
    }

    const ids = toArray(query.id)
    if (ids.length) {
      list = list.filter((c) => ids.includes(c.id))
    }

    const parentIds = toArray(query.parent_category_id)
    if (parentIds.length) {
      list = list.filter((c) => parentIds.includes(c.parent_category_id))
    }

    const limit = Number(query.limit ?? 100)
    const offset = Number(query.offset ?? 0)

    return {
      product_categories: list.slice(offset, offset + limit),
      count: list.length,
      limit,
      offset,
    }
  }

  const categoryMatch = pathname.match(/^\/store\/product-categories\/(.+)$/)
  if (categoryMatch) {
    const product_category =
      categories.find((c) => c.id === categoryMatch[1]) ?? null
    return { product_category }
  }

  // ---- collections -------------------------------------------------------
  if (pathname === "/store/collections") {
    let list = collections

    const handles = toArray(query.handle)
    if (handles.length) {
      list = list.filter((c) => handles.includes(c.handle))
    }

    const limit = Number(query.limit ?? 100)
    const offset = Number(query.offset ?? 0)

    return {
      collections: list.slice(offset, offset + limit),
      count: list.length,
      limit,
      offset,
    }
  }

  const collectionMatch = pathname.match(/^\/store\/collections\/(.+)$/)
  if (collectionMatch) {
    const collection =
      collections.find((c) => c.id === collectionMatch[1]) ?? null
    return { collection }
  }

  return undefined
}
