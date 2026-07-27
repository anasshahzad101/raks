/**
 * Long-tail SEO landing pages ("collections") that capture high-intent
 * Pakistani searches a single category page can't — by material, style and
 * occasion. Each is an indexable page with unique copy, FAQ schema and a
 * keyword-filtered product grid (filtered via the store `q` search).
 *
 * URL: /collections/{slug}/
 */

export type LandingPage = {
  slug: string
  /** Visible H1 + breadcrumb label. */
  heading: string
  /** Store search keyword used to fetch matching products. */
  query: string
  /** Optional category handle to scope the keyword search (e.g. "bras"). */
  categoryHandle?: string
  /** SEO <title>. */
  title: string
  /** Meta description (~155 chars, fact-packed). */
  description: string
  /** Visible intro paragraph(s). */
  intro: string
}

export const landingPages: LandingPage[] = [
  {
    slug: "silk-nighty",
    heading: "Silk Nighty",
    query: "silk",
    title: "Buy Silk Nighty Online in Pakistan | Raks",
    description:
      "Shop silk nighties and silk night dresses in Pakistan at Raks. Smooth, luxurious satin-silk styles in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Discover Raks' silk nighty collection — smooth, breathable and beautifully draping pieces designed to feel as good as they look. From everyday silk night dresses to elegant pieces for special evenings, each style brings a touch of luxury to your nightwear. Available in a range of sizes with Cash on Delivery across Pakistan.",
  },
  {
    slug: "net-nighty",
    heading: "Net Nighty",
    query: "net",
    title: "Buy Net Nighty Online in Pakistan | Raks",
    description:
      "Shop net nighties and sheer babydoll nightwear in Pakistan at Raks. Delicate, breathable net styles in all sizes. Cash on Delivery, discreet packaging.",
    intro:
      "Our net nighty collection blends delicate sheer fabric with flattering, lightweight designs. Soft net and lace detailing make these styles a romantic choice for intimate evenings, while staying breathable and comfortable. Browse the range and order with discreet packaging and Cash on Delivery anywhere in Pakistan.",
  },
  {
    slug: "lace-nighty",
    heading: "Lace Nighty",
    query: "lace",
    title: "Buy Lace Nighty & Lace Lingerie Online in Pakistan | Raks",
    description:
      "Shop lace nighties and lace lingerie in Pakistan at Raks. Elegant lace detailing, flattering fits, every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Lace adds instant elegance to any nightwear, and our lace nighty collection is designed to flatter. From subtle lace trims to all-over lace styles, these pieces are crafted for comfort and confidence. Find your perfect fit from a wide range of sizes, with fast nationwide delivery across Pakistan.",
  },
  {
    slug: "satin-nighty",
    heading: "Satin Nighty",
    query: "satin",
    title: "Buy Satin Nighty Online in Pakistan | Raks",
    description:
      "Shop satin nighties and satin night dresses in Pakistan at Raks. Silky-smooth, cool-to-touch styles in every size. Cash on Delivery, discreet packaging.",
    intro:
      "Satin nighties offer that signature silky-smooth, cool-to-touch feel that makes bedtime feel special. Raks' satin night dress collection ranges from classic slips to detailed designs, all chosen for their luxurious drape and comfort. Order in your size with Cash on Delivery across Pakistan.",
  },
  {
    slug: "cotton-nighty",
    heading: "Cotton Nighty",
    query: "cotton",
    title: "Buy Cotton Nighty Online in Pakistan | Raks",
    description:
      "Shop soft cotton nighties and cotton night suits in Pakistan at Raks. Breathable, everyday comfort in all sizes. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Nothing beats soft cotton for everyday comfort. Our cotton nighty collection is breathable, easy to care for and perfect for Pakistan's warm nights. Whether you prefer a relaxed nightgown or a cotton night suit, you'll find true-to-size, comfortable styles — with Cash on Delivery nationwide.",
  },
  {
    slug: "transparent-nighty",
    heading: "Transparent Nighty",
    query: "transparent",
    title: "Buy Transparent Nighty Online in Pakistan | Raks",
    description:
      "Shop transparent nighties and sheer babydoll nightwear in Pakistan at Raks. Chic, sheer styles in every size. Cash on Delivery, discreet packaging.",
    intro:
      "Our transparent nighty collection features sheer, chic styles designed for romantic evenings. Crafted from soft net and lace, these lightweight pieces flatter every shape while staying comfortable. Shop the range and order discreetly with Cash on Delivery across Pakistan.",
  },
  {
    slug: "bridal-nightwear",
    heading: "Bridal Nightwear",
    query: "bridal",
    title: "Buy Bridal Nightwear & Wedding Night Dress Online in Pakistan | Raks",
    description:
      "Shop bridal nightwear and wedding night dresses in Pakistan at Raks. Elegant bridal nighties for your first night, every size. Cash on Delivery, discreet packaging.",
    intro:
      "Make your wedding night unforgettable with Raks' bridal nightwear collection. From delicate lace bridal nighties to elegant first-night sets, every piece is chosen to make you feel beautiful and confident. Browse bridal styles in a range of sizes, shipped discreetly anywhere in Pakistan.",
  },
  {
    slug: "honeymoon-nighty",
    heading: "Honeymoon Nighty",
    query: "honeymoon",
    title: "Buy Honeymoon Nighty & Lingerie Online in Pakistan | Raks",
    description:
      "Shop honeymoon nighties and lingerie sets in Pakistan at Raks. Romantic styles perfect for your honeymoon, every size. Cash on Delivery, discreet packaging.",
    intro:
      "Pack something special for your honeymoon. Raks' honeymoon nighty and lingerie collection brings together romantic, flattering styles — from sheer babydolls to elegant sets — designed for memorable evenings. Available in a range of sizes with discreet packaging and Cash on Delivery across Pakistan.",
  },
  {
    slug: "short-nighty",
    heading: "Short Nighty",
    query: "short",
    title: "Buy Short Nighty & Babydoll Online in Pakistan | Raks",
    description:
      "Shop short nighties and babydoll nightwear in Pakistan at Raks. Flirty, comfortable short styles in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Short nighties and babydolls are a flirty, comfortable choice for warm nights. Our collection features playful, flattering short styles in soft fabrics and pretty detailing. Find your size and order with Cash on Delivery and discreet packaging anywhere in Pakistan.",
  },
  {
    slug: "long-nighty",
    heading: "Long Nighty",
    query: "long",
    categoryHandle: "nightwear",
    title: "Buy Long Nighty & Full-Length Night Dress Online in Pakistan | Raks",
    description:
      "Shop long nighties and full-length night gowns in Pakistan at Raks. Graceful, modest styles in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Long nighties offer graceful coverage and timeless elegance. Raks' full-length night dress collection ranges from flowing cotton gowns for everyday comfort to detailed styles for special evenings. Modest, flattering and available in a wide range of sizes — with Cash on Delivery across Pakistan.",
  },
  {
    slug: "babydoll-nighty",
    heading: "Babydoll Nighty",
    query: "babydoll",
    title: "Buy Babydoll Nighty & Lingerie Online in Pakistan | Raks",
    description:
      "Shop babydoll nighties and lingerie in Pakistan at Raks. Short, flirty babydoll styles with lace and net detailing, every size. Cash on Delivery, discreet packaging.",
    intro:
      "Babydolls are short, flirty and effortlessly romantic. Our babydoll nighty collection blends soft net, lace and satin into flattering styles, many with a matching panty. Perfect for intimate evenings, shipped discreetly with Cash on Delivery anywhere in Pakistan.",
  },
  {
    slug: "cami-sets",
    heading: "Cami Sets",
    query: "cami",
    title: "Buy Cami Sets & Camisole Nightwear Online in Pakistan | Raks",
    description:
      "Shop cami sets and camisole nightwear in Pakistan at Raks. Lightweight top-and-shorts sets in soft fabrics, every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Cami sets pair a delicate camisole top with matching shorts for a lightweight, modern sleepwear look. Raks' cami set collection comes in soft cotton, silk and satin — ideal for warm nights and relaxed lounging. Find your size with Cash on Delivery across Pakistan.",
  },
  {
    slug: "jersey-nighty",
    heading: "Jersey Nighty",
    query: "jersey",
    categoryHandle: "nightwear",
    title: "Buy Jersey Nighty & Soft Knit Nightwear Online in Pakistan | Raks",
    description:
      "Shop soft jersey nighties and knit nightwear in Pakistan at Raks. Stretchy, breathable everyday comfort in all sizes. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Jersey nighties are prized for their soft, stretchy, breathable feel — perfect for everyday wear. Our jersey nightwear collection moves with you and stays comfortable all night. Available in a range of sizes and styles, with Cash on Delivery nationwide across Pakistan.",
  },
  {
    slug: "bodysuit",
    heading: "Bodysuit",
    query: "bodysuit",
    title: "Buy Bodysuit & Bodystocking Lingerie Online in Pakistan | Raks",
    description:
      "Shop bodysuits and bodystocking lingerie in Pakistan at Raks. Sleek, figure-flattering styles in every size. Cash on Delivery, discreet packaging.",
    intro:
      "A bodysuit is a sleek, figure-flattering one-piece that works as lingerie or layered under outfits. Raks' bodysuit and bodystocking collection features lace, net and smooth styles designed to flatter every shape. Shop the range with discreet packaging and Cash on Delivery across Pakistan.",
  },
  {
    slug: "cotton-bra",
    heading: "Cotton Bra",
    query: "cotton",
    categoryHandle: "bras",
    title: "Buy Cotton Bra Online in Pakistan | Raks",
    description:
      "Shop soft cotton bras in Pakistan at Raks. Breathable, comfortable everyday bras in a range of sizes. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Cotton bras are the go-to for breathable, all-day comfort. Raks' cotton bra collection offers soft, skin-friendly everyday styles that stay comfortable in Pakistan's climate. Available across a range of sizes — order with Cash on Delivery and free delivery over Rs 3,000.",
  },
  {
    slug: "lace-bra",
    heading: "Lace Bra",
    query: "lace",
    categoryHandle: "bras",
    title: "Buy Lace Bra Online in Pakistan | Raks",
    description:
      "Shop elegant lace bras in Pakistan at Raks. Pretty lace detailing with a flattering, comfortable fit, every size. Cash on Delivery, discreet packaging.",
    intro:
      "Lace bras combine pretty detailing with a flattering fit. Raks' lace bra collection ranges from everyday lace styles to dressier designs for special occasions, all chosen for comfort and confidence. Find your size and order with Cash on Delivery anywhere in Pakistan.",
  },
  {
    slug: "silk-robe",
    heading: "Silk Robe",
    query: "robe",
    title: "Buy Silk Robe & Night Robe Online in Pakistan | Raks",
    description:
      "Shop silk and satin robes and dressing gowns in Pakistan at Raks. Smooth, elegant night robes in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "A silk robe adds an instant touch of luxury to your nightwear routine. Raks' robe collection features smooth silk and satin dressing gowns — perfect for layering over a nighty or relaxing in style. Available in a range of sizes with Cash on Delivery across Pakistan.",
  },
  {
    slug: "embroidered-nighty",
    heading: "Embroidered Nighty",
    query: "embroidered",
    title: "Buy Embroidered Nighty & Lingerie Online in Pakistan | Raks",
    description:
      "Shop embroidered nighties and lingerie in Pakistan at Raks. Intricate embroidery and lace detailing, every size. Cash on Delivery, discreet packaging.",
    intro:
      "Embroidered detailing turns a simple nighty into something special. Raks' embroidered nightwear and lingerie collection features delicate stitching, lace and net work on flattering, comfortable styles. Browse the range in a variety of sizes, shipped discreetly anywhere in Pakistan.",
  },
  {
    slug: "floral-nighty",
    heading: "Floral Nighty",
    query: "floral",
    title: "Buy Floral Nighty & Print Night Dress Online in Pakistan | Raks",
    description:
      "Shop floral print nighties and night dresses in Pakistan at Raks. Pretty floral designs in soft fabrics, every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Floral prints bring a fresh, feminine touch to your nightwear. Our floral nighty collection features pretty botanical designs on soft, breathable fabrics — comfortable for everyday wear and lovely to look at. Find your size and order with Cash on Delivery across Pakistan.",
  },
  {
    slug: "thong-panty",
    heading: "Thong Panty",
    query: "thong",
    title: "Buy Thong Panties & Underwear Online in Pakistan | Raks",
    description:
      "Shop thong panties and seamless underwear in Pakistan at Raks. No-show, comfortable styles in a range of sizes. Cash on Delivery, discreet packaging.",
    intro:
      "Thongs are the go-to for a smooth, no-visible-panty-line finish under fitted outfits. Raks' thong collection includes soft cotton, lace and seamless styles designed for everyday comfort. Shop the range with discreet packaging and Cash on Delivery across Pakistan.",
  },
  {
    slug: "slip-dress",
    heading: "Slip Dress",
    query: "slip",
    title: "Buy Slip Dress & Inner Slip Online in Pakistan | Raks",
    description:
      "Shop slip dresses and inner slips in Pakistan at Raks. Smooth, versatile slips for nightwear or layering, every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "A slip dress is effortlessly elegant — wear it as a nighty or layer it under sheer outfits. Raks' slip collection offers smooth silk, satin and jersey styles with a flattering, comfortable drape. Available in a range of sizes with Cash on Delivery across Pakistan.",
  },
  {
    slug: "plus-size-nighty",
    heading: "Plus Size Nighty",
    query: "plus size",
    title: "Buy Plus Size Nighty & Lingerie Online in Pakistan | Raks",
    description:
      "Shop plus size nighties and lingerie in Pakistan at Raks. Comfortable, flattering styles in larger sizes. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Everyone deserves nightwear that fits beautifully. Raks' plus size nighty and lingerie collection brings comfortable, flattering styles in larger sizes — from everyday cotton nighties to elegant lace pieces. Find your perfect fit with Cash on Delivery across Pakistan.",
  },
  {
    slug: "silk-pyjama",
    heading: "Silk Pyjama",
    query: "silk",
    categoryHandle: "pyjama",
    title: "Buy Silk Pyjama Sets for Women Online in Pakistan | Raks",
    description:
      "Shop silk and satin pyjama sets for women in Pakistan at Raks. Smooth, luxurious sleepwear sets in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Silk pyjama sets bring everyday luxury to your sleepwear. Raks' silk and satin pyjama collection pairs a soft top with matching trousers or shorts for a smooth, cool-to-touch feel. Available in a range of sizes with Cash on Delivery across Pakistan.",
  },
  {
    slug: "tummy-tucker",
    heading: "Tummy Tucker Shaper",
    query: "tummy",
    title: "Buy Tummy Tucker & Body Shaper Online in Pakistan | Raks",
    description:
      "Shop tummy tuckers and body shapers in Pakistan at Raks. Smooth, firm tummy-control shapewear in every size. Cash on Delivery, discreet packaging.",
    intro:
      "A tummy tucker smooths and shapes for a confident silhouette under any outfit. Raks' tummy-control shapewear collection offers firm, comfortable support that stays in place all day. Browse the range in a variety of sizes, shipped discreetly with Cash on Delivery across Pakistan.",
  },
  {
    slug: "printed-nighty",
    heading: "Printed Nighty",
    query: "printed",
    title: "Buy Printed Nighty & Night Dress Online in Pakistan | Raks",
    description:
      "Shop printed nighties and night dresses in Pakistan at Raks. Fun prints in soft, breathable fabrics, every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Printed nighties add personality to your nightwear with playful patterns on soft, breathable fabrics. From subtle prints to bold designs, Raks' printed nighty collection keeps everyday sleepwear fun and comfortable. Find your size and order with Cash on Delivery across Pakistan.",
  },
  {
    slug: "cotton-panty",
    heading: "Cotton Panty",
    query: "cotton",
    categoryHandle: "panties",
    title: "Buy Cotton Panties & Underwear Online in Pakistan | Raks",
    description:
      "Shop soft cotton panties and underwear in Pakistan at Raks. Breathable, everyday comfort in a range of sizes. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Soft cotton panties are an everyday essential — breathable, gentle on skin and made for all-day comfort in Pakistan's climate. Raks' cotton underwear collection comes in a range of styles and sizes. Order with discreet packaging and Cash on Delivery across Pakistan.",
  },
]

export const landingBySlug = new Map(landingPages.map((p) => [p.slug, p]))

export const getLandingPage = (slug: string) => landingBySlug.get(slug)

/**
 * Maps a blog post (its title + slug + categories) to the most relevant
 * collection landing pages, so articles can link to commercial pages and pass
 * authority. Used by the "Shop the Collection" block on blog posts.
 */
const RELATED_RULES: [RegExp, string[]][] = [
  [/first.?night|wedding|bridal|trousseau|dulhan/, ["bridal-nightwear", "honeymoon-nighty"]],
  [/honeymoon/, ["honeymoon-nighty", "bridal-nightwear"]],
  [/silk/, ["silk-nighty", "silk-robe"]],
  [/satin/, ["satin-nighty"]],
  [/\bcotton\b/, ["cotton-nighty", "cotton-bra"]],
  [/lace/, ["lace-nighty", "lace-bra"]],
  [/\bnet\b|mesh|sheer|transparent/, ["net-nighty", "transparent-nighty"]],
  [/babydoll/, ["babydoll-nighty"]],
  [/plus.?size/, ["plus-size-nighty"]],
  [/cami|camisole/, ["cami-sets"]],
  [/\bslip\b/, ["slip-dress"]],
  [/jersey|knit/, ["jersey-nighty"]],
  [/floral|printed|print/, ["floral-nighty", "printed-nighty"]],
  [/robe|dressing.?gown/, ["silk-robe"]],
  [/pyjama|pajama/, ["silk-pyjama"]],
  [/shaper|shapewear|tummy/, ["tummy-tucker"]],
  [/panty|panties|thong|underwear/, ["cotton-panty", "thong-panty"]],
  [/bodysuit|bodystocking/, ["bodysuit"]],
  [/\bbra\b|padded|push.?up|saggy|sagging|wired|bust|strapless|backless/, ["cotton-bra", "lace-bra"]],
  [/short.?night|short.?nighty/, ["short-nighty"]],
  [/long.?night|long.?nighty|nightgown/, ["long-nighty"]],
  [/nighty|nightdress|nightwear|night.?dress/, ["silk-nighty", "short-nighty"]],
]

export function getRelatedCollections(text: string, limit = 3): LandingPage[] {
  const t = text.toLowerCase()
  const slugs: string[] = []
  for (const [re, mapped] of RELATED_RULES) {
    if (re.test(t)) {
      for (const s of mapped) if (!slugs.includes(s)) slugs.push(s)
    }
  }
  const result = slugs
    .map((s) => landingBySlug.get(s))
    .filter((p): p is LandingPage => !!p)
    .slice(0, limit)

  if (result.length) return result

  // Fallback for posts with no clear match
  return ["silk-nighty", "bridal-nightwear", "cotton-bra"]
    .map((s) => landingBySlug.get(s))
    .filter((p): p is LandingPage => !!p)
    .slice(0, limit)
}
