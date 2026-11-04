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
import fs from "node:fs"
import path from "node:path"

type AnyRecord = Record<string, any>

/**
 * Read the snapshot from disk rather than `import`ing it.
 *
 * products.json is ~6.7MB. Importing it statically makes webpack parse it into a
 * module AST and inline it into every server chunk that touches this file, which
 * pushed peak `next build` memory past what a managed host allows — the build
 * was killed with a core dump rather than a usable error. Reading at runtime
 * keeps the JSON out of the bundle graph entirely.
 *
 * cwd is the storefront directory for both `next build` and `next start` (the
 * root scripts run through `npm --workspace @dtc/storefront`), but the repo-root
 * candidate is kept so an unexpected cwd fails over instead of failing.
 *
 * A Cloudflare Worker has no disk, so there the same files are fetched from the
 * Worker's static assets, under a path only the Worker itself can reach (see
 * scripts/copy-catalog-to-assets.mjs). They stay out of the bundle either way.
 */
async function loadSnapshot(file: string): Promise<AnyRecord[]> {
  const assets = (globalThis as AnyRecord)[
    Symbol.for("__cloudflare-context__")
  ]?.env?.ASSETS

  if (assets) {
    const res = await assets.fetch(
      `http://assets.local/cdn-cgi/catalog/${file}`
    )
    if (!res.ok) {
      throw new Error(`Catalog snapshot "${file}" missing: ${res.status}`)
    }
    return (await res.json()) as AnyRecord[]
  }

  const candidates = [
    path.join(process.cwd(), "src/content/catalog", file),
    path.join(process.cwd(), "apps/storefront/src/content/catalog", file),
  ]

  for (const candidate of candidates) {
    try {
      return JSON.parse(fs.readFileSync(candidate, "utf8")) as AnyRecord[]
    } catch (err: any) {
      if (err?.code !== "ENOENT") throw err
    }
  }

  // Loud on purpose: an empty catalogue renders 404s on every product page and
  // silently strips them from the sitemap, which is far worse than a hard stop.
  throw new Error(
    `Catalog snapshot "${file}" not found. Looked in:\n  ${candidates.join(
      "\n  "
    )}\nRegenerate it with \`npm run export:catalog\` (needs the Medusa backend running).`
  )
}

let products: AnyRecord[] = []
let categories: AnyRecord[] = []
let collections: AnyRecord[] = []
let regions: AnyRecord[] = []
let loaded = false

/**
 * Load on first use, not at import: this module is imported in every mode, and a
 * Worker cannot fetch while modules load. The result is cached but the pending
 * promise is not, because a Worker must not await another request's I/O.
 */
async function ensureLoaded(): Promise<void> {
  if (loaded) return

  const [productsJson, categoriesJson, collectionsJson, regionsJson] =
    await Promise.all([
      loadSnapshot("products.json"),
      loadSnapshot("categories.json"),
      loadSnapshot("collections.json"),
      loadSnapshot("regions.json"),
    ])

  products = productsJson
  categories = linkCategories(categoriesJson)
  collections = collectionsJson
  regions = regionsJson
  loaded = true
}

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
function linkCategories(categoriesJson: AnyRecord[]): AnyRecord[] {
  const list = categoriesJson.map((c) => ({ ...c }))
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
}

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
export async function snapshotFetch(
  endpoint: string,
  query: AnyRecord = {}
): Promise<unknown | undefined> {
  await ensureLoaded()

  // Strip any query string and normalise trailing slashes.
  const pathname = endpoint.split("?")[0].replace(/\/+$/, "")

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

/** A variant resolved from the snapshot, with its authoritative price. */
export type CatalogVariant = {
  variant_id: string
  product_id: string
  product_handle: string
  product_title: string
  variant_title: string
  variant_sku: string | null
  thumbnail: string | null
  unit_price: number
}

/**
 * Look up a variant and its price from the snapshot.
 *
 * The email order endpoint uses this to rebuild every line from the catalog
 * rather than trusting what the browser posted: the cart lives in localStorage,
 * so prices and titles reaching the server are user-editable.
 *
 * Returns undefined for an unknown variant, which the caller rejects.
 */
export async function findCatalogVariant(
  variantId: string
): Promise<CatalogVariant | undefined> {
  await ensureLoaded()

  for (const product of products) {
    for (const variant of (product.variants ?? []) as AnyRecord[]) {
      if (variant?.id !== variantId) continue

      const amount = variant?.calculated_price?.calculated_amount

      return {
        variant_id: variant.id,
        product_id: product.id,
        product_handle: product.handle ?? "",
        product_title: product.title ?? "",
        variant_title: variant.title ?? "",
        variant_sku: variant.sku ?? null,
        thumbnail: variant.thumbnail ?? product.thumbnail ?? null,
        unit_price: typeof amount === "number" ? amount : 0,
      }
    }
  }

  return undefined
}
