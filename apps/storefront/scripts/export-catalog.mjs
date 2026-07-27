/**
 * Export the Medusa catalog to a static JSON snapshot.
 *
 * The storefront reads this snapshot instead of calling the Medusa API whenever
 * `NEXT_PUBLIC_USE_CATALOG_SNAPSHOT=true` (see `src/lib/catalog-snapshot.ts`).
 * That lets the site build and run — with the full catalog — on hosts that have
 * no Medusa backend, which is how raks.pk is currently deployed.
 *
 * Run it with the Medusa backend up:
 *   npm run export:catalog
 *
 * Re-run whenever the catalog changes, then commit the regenerated JSON.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, "..", "src", "content", "catalog")

const BACKEND =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!KEY) {
  console.error(
    "✖ NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not set. Load .env.local first."
  )
  process.exit(1)
}

/** Superset of every `fields` selection the storefront asks for. */
const PRODUCT_FIELDS = [
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "*variants.images",
  "*variants.options",
  "*options",
  "*images",
  "*categories",
  "*collection",
  "*tags",
  "+metadata",
].join(",")

const CATEGORY_FIELDS = [
  "id",
  "name",
  "handle",
  "description",
  "metadata",
  "parent_category_id",
  "*category_children",
  "*parent_category",
  "*parent_category.parent_category",
  "*parent_category.parent_category.parent_category",
].join(",")

async function api(pathname, query = {}) {
  const url = new URL(pathname, BACKEND)
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url, {
    headers: { "x-publishable-api-key": KEY },
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${url.pathname}`)
  }

  return res.json()
}

/** Page through a list endpoint until every record is collected. */
async function fetchAll(pathname, key, query = {}) {
  const limit = 50
  let offset = 0
  let total = Infinity
  const all = []

  while (offset < total) {
    const data = await api(pathname, { ...query, limit, offset })
    const batch = data[key] ?? []
    all.push(...batch)
    total = data.count ?? batch.length
    if (!batch.length) break
    offset += limit
    process.stdout.write(`\r  ${key}: ${all.length}/${total}`)
  }

  process.stdout.write("\n")
  return all
}

async function main() {
  console.log(`\nExporting catalog from ${BACKEND}\n`)

  // Regions first — products need a region_id for calculated_price to resolve.
  const { regions } = await api("/store/regions", { limit: 100 })
  if (!regions?.length) throw new Error("No regions returned by the backend.")
  const region =
    regions.find((r) => r.countries?.some((c) => c.iso_2 === "pk")) ?? regions[0]
  console.log(`  regions: ${regions.length} (using "${region.name}" for prices)`)

  const products = await fetchAll("/store/products", "products", {
    region_id: region.id,
    fields: PRODUCT_FIELDS,
  })

  const categories = await fetchAll(
    "/store/product-categories",
    "product_categories",
    { fields: CATEGORY_FIELDS }
  )

  const collections = await fetchAll("/store/collections", "collections", {
    fields: "*products",
  })

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = {
    "regions.json": regions,
    "products.json": products,
    "categories.json": categories,
    "collections.json": collections,
  }

  console.log("")
  for (const [name, data] of Object.entries(files)) {
    const file = path.join(OUT_DIR, name)
    fs.writeFileSync(file, JSON.stringify(data))
    const mb = (fs.statSync(file).size / 1024 / 1024).toFixed(2)
    console.log(`  ✓ ${name.padEnd(18)} ${String(data.length).padStart(4)} records  ${mb} MB`)
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        source: BACKEND,
        regionId: region.id,
        counts: {
          regions: regions.length,
          products: products.length,
          categories: categories.length,
          collections: collections.length,
        },
      },
      null,
      2
    )
  )

  console.log(`\nSnapshot written to src/content/catalog/\n`)
}

main().catch((err) => {
  console.error(`\n✖ Export failed: ${err.message}\n`)
  process.exit(1)
})
