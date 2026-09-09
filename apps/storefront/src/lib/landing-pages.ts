/**
 * Long-tail SEO landing pages ("collections") that capture high-intent
 * Pakistani searches a single category page can't — by material, style and
 * occasion. Each is an indexable page with unique copy, FAQ schema and a
 * keyword-filtered product grid (filtered via the store `q` search).
 *
 * URL: /collections/{slug}/
 */

import type { Faq } from "./faqs"

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
  /**
   * Long-form sections rendered under the product grid. These pages carried
   * ~200 words against the category pages' ~2,000, which is a large part of
   * why none of them ranked; the buying-guide copy is what earns the position.
   */
  body?: { heading: string; paragraphs: string[] }[]
  /** Page-specific Q&As. Without these the page falls back to the templated
   * category FAQs, which are near-identical across all 26 collections. */
  faqs?: Faq[]
  /** Category handle this collection sits under — rendered as a real link so
   * the page is not a crawl dead end. */
  parentCategory?: string
  /** Sibling collection slugs to cross-link. */
  related?: string[]
}

/**
 * Collection H1s carry the market the same way category H1s do — Search
 * Console shows Pakistani shoppers attaching "in pakistan" to almost every
 * commercial nightwear query. Headings that already name the market are left
 * alone.
 */
export function landingH1(page: LandingPage): string {
  return /pakistan/i.test(page.heading)
    ? page.heading
    : `${page.heading} in Pakistan`
}

export const landingPages: LandingPage[] = [
  {
    slug: "silk-nighty",
    parentCategory: "nightwear",
    related: ["satin-nighty", "long-nighty", "nightgown"],
    heading: "Silk Nighty",
    query: "silk",
    title: "Buy Silk Nighty Online in Pakistan | Raks",
    description:
      "Shop silk nighties and silk night dresses in Pakistan at Raks. Smooth, luxurious satin-silk styles in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Smooth, fluid nightwear with the drape and sheen of silk — satin and silk-feel styles that slip on cool and hang beautifully. Most nightwear sold as \"silk\" in Pakistan, here and elsewhere, is a satin weave rather than natural silk; the two look and drape alike but wash differently. Where a supplier has given us the exact composition, it is listed in the Fabric & Care panel on that product page. Available in a range of sizes with Cash on Delivery across Pakistan.",
    body: [
      {
        heading: "Is this real silk or satin?",
        paragraphs: [
          "Satin is a weave, not a fibre. A satin nighty can be woven from polyester, rayon or silk, and all three give the same glossy face and fluid drape. Natural silk is the fibre itself, and it costs several times more.",
          "Almost everything sold as a silk nighty in Pakistan at everyday prices is polyester satin. That is not a problem in itself — it drapes well, holds colour and survives washing better than natural silk — but it is worth knowing what you are buying. Check the Fabric & Care panel on each product page, which shows the composition where the supplier stated one.",
          "The practical difference is care. Polyester satin handles a gentle machine wash. Natural silk needs hand washing in cool water and drying flat away from sun.",
        ],
      },
    ],
  },
  {
    slug: "net-nighty",
    parentCategory: "nightwear",
    related: ["transparent-nighty", "lace-nighty", "babydoll-nighty"],
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
    parentCategory: "nightwear",
    related: ["net-nighty", "sexy-nighty", "babydoll-nighty"],
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
    parentCategory: "nightwear",
    related: ["silk-nighty", "short-nighty", "slip-dress"],
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
    parentCategory: "nightwear",
    related: ["printed-nighty", "jersey-nighty", "long-nighty"],
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
    parentCategory: "nightwear",
    related: ["net-nighty", "sexy-nighty", "babydoll-nighty"],
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
    parentCategory: "nightwear",
    related: ["honeymoon-nighty", "nighty-sets", "nightgown"],
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
    parentCategory: "nightwear",
    related: ["bridal-nightwear", "sexy-nighty", "nighty-sets"],
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
    parentCategory: "nightwear",
    related: ["babydoll-nighty", "satin-nighty", "sexy-nighty"],
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
    parentCategory: "nightwear",
    related: ["nightgown", "silk-nighty", "cotton-nighty"],
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
    parentCategory: "nightwear",
    related: ["short-nighty", "net-nighty", "sexy-nighty"],
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
    parentCategory: "nightwear",
    related: ["nighty-sets", "short-nighty", "cotton-nighty"],
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
    parentCategory: "nightwear",
    related: ["cotton-nighty", "printed-nighty", "long-nighty"],
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
    parentCategory: "lingerie",
    related: ["sexy-nighty", "slip-dress"],
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
    parentCategory: "bras",
    related: ["lace-bra"],
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
    parentCategory: "bras",
    related: ["cotton-bra"],
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
    parentCategory: "nightwear",
    related: ["nightgown", "nighty-sets", "silk-nighty"],
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
    parentCategory: "nightwear",
    related: ["lace-nighty", "silk-nighty", "bridal-nightwear"],
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
    parentCategory: "nightwear",
    related: ["printed-nighty", "cotton-nighty", "silk-nighty"],
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
    parentCategory: "panties",
    related: ["cotton-panty"],
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
    parentCategory: "nightwear",
    related: ["satin-nighty", "short-nighty", "silk-nighty"],
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
    parentCategory: "nightwear",
    related: ["long-nighty", "cotton-nighty", "nightgown"],
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
    parentCategory: "pyjama",
    related: ["cotton-nighty", "nighty-sets"],
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
    parentCategory: "shapewear",
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
    parentCategory: "nightwear",
    related: ["floral-nighty", "cotton-nighty", "jersey-nighty"],
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
    parentCategory: "panties",
    related: ["thong-panty"],
    heading: "Cotton Panty",
    query: "cotton",
    categoryHandle: "panties",
    title: "Buy Cotton Panties & Underwear Online in Pakistan | Raks",
    description:
      "Shop soft cotton panties and underwear in Pakistan at Raks. Breathable, everyday comfort in a range of sizes. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "Soft cotton panties are an everyday essential — breathable, gentle on skin and made for all-day comfort in Pakistan's climate. Raks' cotton underwear collection comes in a range of styles and sizes. Order with discreet packaging and Cash on Delivery across Pakistan.",
  },
  // ---------------------------------------------------------------------
  // Intent-led nightwear pages.
  //
  // The collections above are organised by fabric (silk, net, lace, satin,
  // cotton...), but fabric accounts for 7 of 616 nightwear impressions in
  // Search Console. The demand is occasion and format: bridal/first-night
  // (197 impressions), sexy/hot (108), girls (80) and multi-piece sets (35).
  // These three cover the gaps that have both real demand and real stock
  // behind them; "girls" is left to its existing category, which has too few
  // matching products to support a page of its own.
  // ---------------------------------------------------------------------
  {
    slug: "sexy-nighty",
    heading: "Sexy Nighty & Hot Night Dress",
    query: "sexy",
    categoryHandle: "nightwear",
    title: "Sexy Nighty & Hot Night Dress Online in Pakistan | Raks",
    description:
      "Shop sexy nighties and hot night dresses in Pakistan at Raks. Lace, mesh and satin styles in every size. Cash on Delivery, discreet plain packaging.",
    intro:
      "Raks' sexy nighty collection brings together the styles our customers reach for when they want to feel confident — sheer lace, soft mesh, deep necklines and satin that catches the light. Every piece is chosen to flatter rather than expose, in sizes that actually fit, and every order ships in plain unbranded packaging with Cash on Delivery anywhere in Pakistan.",
    parentCategory: "nightwear",
    related: ["bridal-nightwear", "honeymoon-nighty", "short-nighty"],
    body: [
      {
        heading: "What makes a nighty feel special rather than uncomfortable",
        paragraphs: [
          "The pieces women actually wear more than once share a few things: fabric that moves with you, a neckline that stays where you put it, and straps that hold without digging in. Stiff, scratchy lace looks striking on a hanger and gets worn once. Soft stretch lace, brushed mesh and silk-feel satin are what make a piece something you reach for again.",
          "Fit matters more than the style name. A babydoll that skims the body flatters far more than one pulled tight, and a slip cut on the bias drapes over the hips instead of clinging to them. If you are between sizes in this range, size up — the drape is the point.",
        ],
      },
      {
        heading: "Choosing for the occasion",
        paragraphs: [
          "For a wedding night or honeymoon, most brides in Pakistan choose a longer silk or satin piece with lace detail — elegant, photographs beautifully, and comfortable enough to sleep in. Our bridal nightwear collection covers those styles specifically.",
          "For everyday confidence, short satin slips and cami sets work best: light enough for warm nights, simple enough to wear under a robe. Sheer mesh and strappy pieces sit at the bolder end of the range and are usually bought for a specific evening rather than regular wear.",
        ],
      },
      {
        heading: "Buying discreetly in Pakistan",
        paragraphs: [
          "Every Raks order ships in plain, unbranded packaging — nothing on the outside identifies what is inside or where it came from. Cash on Delivery is available nationwide, so you can pay at your door without any card details, and delivery is free on orders over Rs 3,000.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is the packaging discreet?",
        answer:
          "Yes. Every order ships in plain, unbranded packaging with no indication of the contents or the sender, and Cash on Delivery means there is no card statement either.",
      },
      {
        question: "What sizes do sexy nighties come in?",
        answer:
          "Most styles run from Small through XL, and several pieces are available in plus sizes. Exact sizes are listed on each product page. If you are between sizes in this range, size up — these styles are designed to drape rather than cling.",
      },
      {
        question: "What fabrics are used?",
        answer:
          "Mainly soft stretch lace, brushed mesh, silk-feel satin and light net. These are chosen to stay comfortable through a warm Pakistani night, rather than the stiff lace that looks good on a hanger but is unwearable.",
      },
      {
        question: "How much does a sexy nighty cost in Pakistan?",
        answer:
          "Prices vary by fabric and by how many pieces are in the set. Current prices are shown on every product in the grid above, and delivery is free on orders over Rs 3,000.",
      },
      {
        question: "Can I return it if the fit is wrong?",
        answer:
          "Yes. Unworn items with the tags intact can be exchanged for a different size within 15 days of delivery.",
      },
    ],
  },
  {
    slug: "nighty-sets",
    heading: "Nighty Sets",
    query: "set",
    categoryHandle: "nightwear",
    title: "Nighty Sets Online in Pakistan — 2, 3, 5 & 6 Piece | Raks",
    description:
      "Shop nighty sets in Pakistan at Raks — 2, 3, 5 and 6 piece nightgown sets with matching robes. All sizes, Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "A nighty set gives you the full look in one order — typically a nightdress with a matching robe, and in the larger sets a bra, panty and sometimes a belt or stockings as well. Multi-piece sets are the most popular way to buy bridal and honeymoon nightwear in Pakistan, because everything is designed to match and a set works out cheaper than buying each piece separately.",
    parentCategory: "nightwear",
    related: ["bridal-nightwear", "honeymoon-nighty", "cami-sets"],
    body: [
      {
        heading: "What comes in a nighty set",
        paragraphs: [
          "A 2-piece set is usually a nightdress with a matching robe, or a cami with shorts. A 3-piece adds a bra or a belt. The 5 and 6 piece sets — the ones most brides buy — generally include a long gown, a short nightdress, a robe, a bra and a panty, and sometimes stockings or a hair accessory.",
          "The piece count is in every product title, so you can see what you are getting before you order. What is included varies slightly between designs, and the full contents are described on each product page.",
        ],
      },
      {
        heading: "Why sets are the popular choice for brides",
        paragraphs: [
          "For a wedding trousseau, a set solves the whole problem at once: the gown, the robe and the pieces underneath are designed together, in the same fabric and colour family, so nothing clashes. It is also simpler to pack — one set covers the wedding night and the first few days of a honeymoon.",
          "Silk and satin sets in ivory, blush and deep red are the most requested for bridal use in Pakistan. Printed and cotton sets are more common for everyday wear and for gifting.",
        ],
      },
      {
        heading: "Sizing and care",
        paragraphs: [
          "Sets are sized on the main nightdress, with the robe cut to layer comfortably over it. Where individual pieces have their own size options, those are listed separately on the product page.",
          "Silk and satin sets should be hand-washed cold, or machine-washed on a delicate cycle inside a mesh bag, and dried in shade rather than direct sun. Cotton and jersey sets can be machine-washed normally.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is included in a 6 piece nighty set?",
        answer:
          "Most 6 piece sets include a long gown, a short nightdress, a matching robe, a bra, a panty and one extra piece such as a belt or stockings. The exact contents are listed on each product page, since they vary slightly between designs.",
      },
      {
        question: "How much does a 6 piece nighty set cost in Pakistan?",
        answer:
          "It depends on the fabric — silk and satin bridal sets cost more than printed or cotton ones. Current prices for every set are shown in the grid above, and delivery is free on orders over Rs 3,000.",
      },
      {
        question: "Are nighty sets good for a bridal trousseau?",
        answer:
          "Yes, they are the most common choice. A set means the gown, robe and pieces underneath are all designed to match, which saves assembling the look from separate purchases, and one set usually covers the wedding night and the first days of a honeymoon.",
      },
      {
        question: "Do all the pieces come in the same size?",
        answer:
          "Sets are sized on the main nightdress, with the robe cut to layer over it. Where individual pieces have their own size options, those are shown on the product page.",
      },
      {
        question: "How do I wash a silk or satin nighty set?",
        answer:
          "Hand-wash cold, or machine-wash on a delicate cycle inside a mesh laundry bag. Dry in shade rather than direct sunlight, which fades satin quickly.",
      },
    ],
  },
  {
    slug: "nightgown",
    heading: "Nightgown",
    query: "gown",
    categoryHandle: "nightwear",
    title: "Buy Nightgowns Online in Pakistan — Long & Short | Raks",
    description:
      "Shop nightgowns in Pakistan at Raks — long silk gowns, satin nightgowns and gown sets in every size. Cash on Delivery, free delivery over Rs 3,000.",
    intro:
      "A nightgown is the long, flowing end of nightwear — usually ankle or calf length, cut loose through the body, and often sold with a matching robe. It is the style most women choose for comfort over a full night's sleep, and the one most often bought for weddings and as a gift.",
    parentCategory: "nightwear",
    related: ["long-nighty", "silk-nighty", "bridal-nightwear"],
    body: [
      {
        heading: "Nightgown, nighty or night dress?",
        paragraphs: [
          "In Pakistan these words are used almost interchangeably, but there is a useful distinction when you are shopping. A nightgown is long and loose, designed for sleeping. A nighty is the general term and covers any length. A night dress usually means something shorter and more fitted.",
          "If you want something to actually sleep in through a warm night, a loose gown in silk, satin or cotton is the most comfortable choice — it does not ride up, and it lets air move.",
        ],
      },
      {
        heading: "Choosing the right length and fabric",
        paragraphs: [
          "Full-length gowns suit cooler months and air-conditioned rooms. Calf-length is the easier year-round choice in most of Pakistan. For summer, cotton and light satin breathe far better than heavy silk blends or anything lined.",
          "Look for a gown with either adjustable straps or a proper shoulder — thin fixed straps on a long gown tend to slip. A side slit makes a long gown much easier to move and sleep in.",
        ],
      },
      {
        heading: "Gowns for weddings and gifting",
        paragraphs: [
          "Long silk and satin nightgowns in ivory, blush and deep red are the standard bridal choice, usually bought as part of a multi-piece set with a matching robe. They photograph well and are comfortable enough to sleep in, which is why they remain the most requested trousseau item.",
          "Gowns are also the safest nightwear gift, because the loose cut is far more forgiving on sizing than fitted styles.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between a nightgown and a nighty?",
        answer:
          "A nightgown is long and loosely cut, designed for sleeping comfortably. Nighty is the general term used in Pakistan for any nightwear dress, whatever the length. A night dress usually means a shorter, more fitted style.",
      },
      {
        question: "Which nightgown fabric is best for Pakistan's summer?",
        answer:
          "Cotton and light satin. Both let air move and stay cool against the skin. Heavy silk blends and anything lined trap heat, and are better suited to winter or air-conditioned rooms.",
      },
      {
        question: "What length should I choose?",
        answer:
          "Calf-length is the easiest year-round choice for most of Pakistan. Full-length gowns suit cooler months and air-conditioned rooms. A side slit makes either length far easier to move and sleep in.",
      },
      {
        question: "Do nightgowns come with a robe?",
        answer:
          "Many do. Gowns sold as part of a set usually include a matching robe, and the larger bridal sets add a short nightdress and pieces to wear underneath. What is included is listed on each product page.",
      },
      {
        question: "Are nightgowns a good gift?",
        answer:
          "Yes — the loose cut is much more forgiving on sizing than fitted styles, so getting the size slightly wrong matters less.",
      },
    ],
  },
]

export const landingBySlug = new Map(landingPages.map((p) => [p.slug, p]))

export const getLandingPage = (slug: string) => landingBySlug.get(slug)

/** Collections that sit under a category, for the category page's "Shop by
 * style" block. Derived from parentCategory so adding a collection wires it
 * into the category automatically. */
export const getCollectionsForCategory = (handle: string): LandingPage[] =>
  landingPages.filter((p) => p.parentCategory === handle)

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
  [/\bbras?\b|padded|push.?up|saggy|sagging|wired|bust|strapless|backless/, ["cotton-bra", "lace-bra"]],
  [/short.?night|short.?nighty/, ["short-nighty"]],
  [/long.?night|long.?nighty|nightgown|night.?gown/, ["nightgown", "long-nighty"]],
  [/\bsets?\b|\d\s*(?:piece|pcs)|piece|pcs/, ["nighty-sets", "cami-sets"]],
  [/sexy|\bhot\b|romantic|seduct|bold/, ["sexy-nighty", "honeymoon-nighty"]],
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
