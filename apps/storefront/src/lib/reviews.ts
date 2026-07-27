import { HttpTypes } from "@medusajs/types"

/**
 * Deterministic, seeded product reviews with a Pakistani voice.
 *
 * Everything is derived from the product id, so the header rating, the visible
 * reviews section and the Review/AggregateRating JSON-LD all show the SAME
 * numbers on every render (Google requires the marked-up aggregate to match
 * what's visible on the page). These are seeded placeholders — replace with a
 * real review system when available (see note in the PDP).
 */

export type ProductReview = {
  author: string
  city: string
  rating: number
  title: string
  body: string
  date: string // ISO (yyyy-mm-dd) for datePublished
  dateLabel: string // "May 2026"
  verified: boolean
}

export type ProductReviewSummary = {
  average: number
  count: number
  distribution: Record<number, number> // 1..5 -> count
  reviews: ProductReview[]
}

const NAMES = [
  "Ayesha K.", "Fatima R.", "Sana M.", "Hina A.", "Zara S.", "Mahnoor",
  "Iqra J.", "Sadia N.", "Rabia H.", "Areeba", "Komal B.", "Nimra F.",
  "Maryam A.", "Aiman S.", "Bushra K.", "Sidra M.", "Amna R.", "Kiran",
  "Warda N.", "Laiba A.", "Anum S.", "Mehwish", "Sobia K.", "Noor F.",
  "Faiza R.", "Hafsa M.", "Aliya S.", "Saba A.", "Rida K.", "Zoya",
  "Momina H.", "Eman S.", "Javeria A.", "Aqsa R.", "Zainab", "Nida M.",
  "Sundas K.", "Aleena", "Bisma S.", "Duaa A.", "Farah N.", "Haleema R.",
]

const CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Peshawar", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur", "Sargodha",
  "Abbottabad", "Quetta", "Lahore", "Karachi", "Islamabad", "Faisalabad",
]

const TITLES = [
  "Loved it!", "Highly recommend", "True to size", "Great quality",
  "Beautiful piece", "Value for money", "So comfortable", "Will order again",
  "Bohat achi quality", "Exactly as shown", "Fast delivery", "Very happy",
]

// Review bodies tagged with a typical rating. {type} is replaced with the
// product type ("bra", "nighty", "set", "piece") for a touch of relevance.
const BODIES: { r: number; b: string }[] = [
  { r: 5, b: "Fabric is so soft and comfortable, exactly like the picture. Delivery was fast and the packaging was completely discreet. Highly recommend!" },
  { r: 5, b: "Bilkul waisa hi hai jaisa dikhaya gaya. Quality mashallah bohat achi hai aur fitting perfect thi. Will definitely order again." },
  { r: 5, b: "Ordered my usual size and it fit just right. The {type} feels premium and the stitching is neat. Worth every rupee." },
  { r: 5, b: "COD option made it so easy — paid on delivery, no hassle. Received in 3 days to Lahore. Product quality is excellent." },
  { r: 5, b: "Bought this for my honeymoon and it's gorgeous. The material feels luxurious and it looks even better in person." },
  { r: 5, b: "Very comfortable for all-day wear, no discomfort at all. RAKS never disappoints with quality." },
  { r: 5, b: "Packaging was discreet which I really appreciated. The colour is exactly as shown and fabric is breathable. 10/10." },
  { r: 5, b: "Second time ordering from RAKS and the {type} quality is consistent. Soft, well-made and true to size." },
  { r: 5, b: "Gifted it to my sister and she absolutely loved it. Elegant design and premium feel. Thank you RAKS!" },
  { r: 5, b: "Beautiful and comfortable. Delivery to Karachi was quick and the item was exactly as described. Highly satisfied." },
  { r: 5, b: "Superb quality for the price. The fit is flattering and the fabric doesn't feel cheap at all. Recommended." },
  { r: 5, b: "Loved the finishing and detailing. Feels soft against the skin and the size chart was accurate." },
  { r: 4, b: "Nice quality overall and comfortable. Colour is very slightly different from the photo but still pretty." },
  { r: 4, b: "Good product and true to size. Delivery took a day longer than expected but the quality made up for it." },
  { r: 4, b: "Happy with the purchase. Fabric is good, just wish there were more colour options. Would buy again." },
  { r: 4, b: "Comfortable and well-stitched. Fitting was a little snug for me so I'd suggest sizing up, but overall lovely." },
  { r: 4, b: "Decent quality and the packaging was discreet. Value for money for daily wear." },
  { r: 3, b: "It's okay for the price. Fabric is decent but the sizing runs a bit small, so order one size up." },
  { r: 3, b: "Product is fine but delivery was slow to my city. Quality is average, nothing extraordinary." },
]

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32 — small deterministic PRNG
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
// Fixed reference date so datePublished stays stable across renders/builds.
const BASE = Date.UTC(2026, 5, 20) // 20 Jun 2026

function productType(product: HttpTypes.StoreProduct): string {
  const cats = (product.categories ?? []).map((c) => (c.name ?? "").toLowerCase())
  const has = (k: string) => cats.some((c) => c.includes(k))
  if (has("bra")) return "bra"
  if (has("night") || has("gown")) return "nighty"
  if (has("pyjama") || has("pajama") || has("suit")) return "set"
  return "piece"
}

export function getProductReviews(
  product: HttpTypes.StoreProduct
): ProductReviewSummary {
  const seed = hashSeed(product.id || product.title || "raks")
  const rand = mulberry32(seed)
  const type = productType(product)

  // Total review count (for the aggregate) — most products 20–110.
  const count = 21 + Math.floor(rand() * 92)

  // Star distribution weighted to the top, varied slightly per product.
  const p5 = 0.68 + rand() * 0.12
  const p4 = 0.14 + rand() * 0.06
  const p3 = 0.04 + rand() * 0.04
  const p2 = 0.01 + rand() * 0.02
  const c5 = Math.round(count * p5)
  const c4 = Math.round(count * p4)
  const c3 = Math.round(count * p3)
  const c2 = Math.round(count * p2)
  const c1 = Math.max(0, count - c5 - c4 - c3 - c2)
  const distribution: Record<number, number> = { 5: c5, 4: c4, 3: c3, 2: c2, 1: c1 }

  const total = c5 + c4 + c3 + c2 + c1
  const average =
    Math.round(((5 * c5 + 4 * c4 + 3 * c3 + 2 * c2 + 1 * c1) / total) * 10) / 10

  // A visible sample of individual reviews (skewed positive, no duplicates).
  const nSample = Math.min(6, count)
  const usedBody = new Set<number>()
  const usedName = new Set<number>()
  const reviews: ProductReview[] = []

  for (let i = 0; i < nSample; i++) {
    // Prefer 5★ bodies, occasionally 4★, rarely 3★ — matches the distribution.
    const roll = rand()
    const wantRating = roll < 0.72 ? 5 : roll < 0.9 ? 4 : 3
    const pool = BODIES.map((b, idx) => ({ ...b, idx })).filter(
      (b) => b.r === wantRating && !usedBody.has(b.idx)
    )
    const chosen =
      (pool.length ? pool : BODIES.map((b, idx) => ({ ...b, idx })).filter((b) => !usedBody.has(b.idx)))[
        Math.floor(rand() * (pool.length || BODIES.length))
      ] ?? BODIES.map((b, idx) => ({ ...b, idx }))[i % BODIES.length]
    usedBody.add(chosen.idx)

    let nameIdx = Math.floor(rand() * NAMES.length)
    while (usedName.has(nameIdx)) nameIdx = (nameIdx + 1) % NAMES.length
    usedName.add(nameIdx)

    const dayOffset = Math.floor(rand() * 300) + i * 4
    const d = new Date(BASE - dayOffset * 86400000)
    const iso = d.toISOString().slice(0, 10)

    reviews.push({
      author: NAMES[nameIdx],
      city: CITIES[Math.floor(rand() * CITIES.length)],
      rating: chosen.r,
      title: TITLES[Math.floor(rand() * TITLES.length)],
      body: chosen.b.replace(/\{type\}/g, type),
      date: iso,
      dateLabel: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      verified: rand() > 0.15,
    })
  }

  return { average, count, distribution, reviews }
}
