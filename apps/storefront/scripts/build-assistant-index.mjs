#!/usr/bin/env node
/**
 * Build the shopping assistant's product index.
 *
 * The assistant recommends real products at real prices, so it needs catalogue
 * data. Shipping the full catalogue to the browser would be roughly a megabyte
 * of JSON on every page, so this writes a slim index to /public instead, which
 * the assistant fetches only when someone actually opens it.
 *
 * Products with no price are excluded: 28 of the 207 were never priced in the
 * source data and cannot be bought, so the assistant must not offer them.
 *
 * Run: node scripts/build-assistant-index.mjs   (wired into prebuild)
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const catalog = path.join(root, "src/content/catalog/products.json")
const out = path.join(root, "public/assistant-index.json")

const raw = JSON.parse(fs.readFileSync(catalog, "utf8"))
const products = Array.isArray(raw) ? raw : raw.products ?? Object.values(raw)

const strip = (h) =>
  String(h ?? "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()

/** Distinct option values for a product, by option title. */
const optionValues = (product, re) => {
  const seen = new Set()
  for (const v of product.variants ?? []) {
    for (const o of v.options ?? []) {
      if (re.test(o?.option?.title ?? "") && o?.value) seen.add(String(o.value))
    }
  }
  return [...seen]
}

/** The cheapest purchasable variant — what the assistant offers to add. */
const cheapestVariant = (product) => {
  let best = null
  for (const v of product.variants ?? []) {
    const amount = v.calculated_price?.calculated_amount
    if (typeof amount !== "number" || amount <= 0) continue
    if (!best || amount < best.amount) {
      best = { id: v.id, title: v.title ?? "", amount }
    }
  }
  return best
}

// Tag products by shopping intent, from the data rather than by hand.
const FABRIC = /(cotton|silk|satin|linen|lace|net|jersey|velvet|mesh|modal|chiffon)/i
const OCCASION = [
  ["teen", /teen|teenager|first bra|training bra/i],
  ["bridal", /bridal|wedding|dulhan|nikah/i],
  ["honeymoon", /honeymoon|first night|romantic/i],
  ["everyday", /everyday|daily|basic|casual|comfort/i],
  ["sports", /sport|active|gym|workout/i],
  ["nursing", /nursing|maternity|feeding|pregnan/i],
  ["party", /party|fancy|evening|glam/i],
]

const index = []
let skippedNoPrice = 0

for (const p of products) {
  const variant = cheapestVariant(p)
  if (!variant) { skippedNoPrice++; continue }

  const text = `${p.title ?? ""} ${strip(p.description).slice(0, 600)}`
  const cats = (p.categories ?? []).map((c) => c.handle).filter(Boolean)

  const fabrics = [...new Set((text.match(new RegExp(FABRIC, "gi")) ?? []).map((f) => f.toLowerCase()))]
  const occasions = OCCASION.filter(([, re]) => re.test(text)).map(([name]) => name)

  index.push({
    id: p.id,
    h: p.handle,
    t: p.title,
    // cheapest purchasable variant, so "add to bag" always works
    v: variant.id,
    vt: variant.title,
    p: variant.amount,
    img: p.thumbnail ?? p.images?.[0]?.url ?? null,
    c: cats,
    sizes: optionValues(p, /^sizes?$/i),
    cups: optionValues(p, /^cup size$/i),
    colors: optionValues(p, /^colou?r$/i),
    f: fabrics,
    o: occasions,
  })
}

index.sort((a, b) => a.p - b.p)

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(index), "utf8")

const bytes = fs.statSync(out).size
console.log(
  `assistant index: ${index.length} purchasable products, ` +
    `${skippedNoPrice} skipped with no price, ${(bytes / 1024).toFixed(1)} KB`
)
console.log(
  `  price range Rs ${index[0].p} – Rs ${index[index.length - 1].p}`
)
