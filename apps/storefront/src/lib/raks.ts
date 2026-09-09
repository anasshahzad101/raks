/**
 * Central Raks brand + SEO configuration.
 * Single source of truth for site identity, canonical URLs, and currency.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://raks.pk"
).replace(/\/$/, "")

export const BRAND = {
  name: "Raks",
  legalName: "Raks",
  tagline: "Lingerie & Nightwear in Pakistan",
  description:
    "Raks is Pakistan's home for premium lingerie, bras, nightwear and shapewear — designed for comfort, confidence and everyday elegance.",
  logo: "/media/uploads/2025/01/Untitled-1BLACK.png",
  favicon: "/media/uploads/2025/01/FAVICON.png",
  currency: "PKR",
  currencyCode: "pkr",
  locale: "en_PK",
  country: "PK",
  // The only contact address published anywhere on the site. Replace once a
  // monitored @raks.pk mailbox exists (OWNER-03) and update pages.json with it.
  email: "raks@gmail.com",
  instagram: "https://www.instagram.com/rakslingeriepk/",
} as const

/**
 * Stable node id for the Organization entity.
 *
 * The Organization is emitted once, in the root layout. Everything else that
 * needs to name the publisher references this id instead of repeating the
 * object, so a blog page describes one organisation rather than three.
 */
export const ORG_ID = `${SITE_URL}/#organization`

/**
 * The official RAKS profiles, supplied by the owner on 9 September 2026 and each
 * one opened and checked before being listed here.
 *
 * `sameAs` is how search and answer engines connect this site to the brand's
 * other properties, so a wrong or unverified entry lowers confidence rather than
 * raising it.
 *
 * Verified 9 September 2026:
 *  - instagram.com/rakslingeriepk   "RAKS", bio links raks.pk, phone in bio
 *  - facebook.com/…61574939832849   Page, "Lingerie and underwear shop",
 *                                   Bahria Town Lahore, phone, links raks.pk
 *  - tiktok.com/@rakslingeriepk     "RAKS", phone in bio (no posts yet)
 *  - youtube.com/@RAKSlingeriepk    "RAKS", links raks.pk (no videos yet)
 *  - pinterest.com/rakslahore       "RAKS", 210 pins, links raks.pk
 *
 * NOT listed: instagram.com/raks.pk. It was in this config before, and it does
 * resolve to an account called "Raks" in Lahore, but the owner's list does not
 * include it. Left out until confirmed, because pointing the entity graph at an
 * account the business may not control is worse than omitting it (OWNER-20).
 */
export const SOCIAL_PROFILES = [
  {
    label: "IG",
    name: "Instagram",
    url: "https://www.instagram.com/rakslingeriepk/",
  },
  {
    label: "FB",
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61574939832849",
  },
  {
    label: "TT",
    name: "TikTok",
    url: "https://www.tiktok.com/@rakslingeriepk",
  },
  {
    label: "YT",
    name: "YouTube",
    url: "https://www.youtube.com/@RAKSlingeriepk",
  },
  {
    label: "PIN",
    name: "Pinterest",
    url: "https://www.pinterest.com/rakslahore/",
  },
] as const

/**
 * The Google Business Profile listing, "RAKS - Lingerie Studio Pakistan".
 * Category "Lingerie store", website raks.pk, phone matching the one below.
 * Declared alongside the social profiles so the site and the Google listing
 * resolve to the same entity.
 */
export const GOOGLE_BUSINESS_PROFILE =
  "https://www.google.com/maps/place/RAKS+-+Lingerie+Studio+Pakistan/data=!4m2!3m1!1s0x0:0x5bf2039a6c0afbae"

/** Every verified property, for schema.org `sameAs`. */
export const SAME_AS = [
  ...SOCIAL_PROFILES.map((s) => s.url),
  GOOGLE_BUSINESS_PROFILE,
]

/** Facts about the business that are demonstrably true from the site itself. */
export const BUSINESS_FACTS = {
  areaServed: "Pakistan",
  currency: "PKR",
  paymentAccepted: "Cash on Delivery",
  // Confirmed on four owner-controlled listings: the Google Business Profile,
  // the Facebook page, and the TikTok and Instagram bios. E.164 for schema.
  telephone: "+92-339-5400416",
  // The Facebook page gives the location as Bahria Town, Lahore. The Google
  // Business Profile publishes no street address, which is normal for a
  // delivery business, so only the city is asserted here. A full street address
  // needs the owner to confirm it is a public, visitable one (OWNER-01).
  addressLocality: "Lahore",
  addressCountry: "PK",
  knowsAbout: [
    "lingerie",
    "bras",
    "nightwear",
    "nighties",
    "pyjamas",
    "panties",
    "shapewear",
  ],
} as const

/**
 * Delivery, payment and returns promise. One source, because these numbers were
 * previously retyped by hand across pages, category copy, llms.txt and agents.md
 * and had already drifted: the product page promised dispatch in "1–2 days"
 * while everything else said 3 to 5 days delivery.
 *
 * These reflect what the site already publishes. The exchange window and the
 * delivery window still need owner confirmation (OWNER-06, OWNER-08), so change
 * them here and every surface follows.
 */
export const POLICY = {
  freeDeliveryThreshold: 3000,
  deliveryDaysMin: 3,
  deliveryDaysMax: 5,
  exchangeWindowDays: 15,
  codAvailable: true,
  packaging: "plain, unbranded packaging",
} as const

/** "3–5 business days" — the delivery window, written once. */
export const deliveryWindow = () =>
  `${POLICY.deliveryDaysMin}–${POLICY.deliveryDaysMax} business days`

/** "Rs 3,000" — the free delivery threshold, formatted. */
export const freeDeliveryThresholdLabel = () =>
  formatPKR(POLICY.freeDeliveryThreshold)

/**
 * Year for copyright lines. The footer and the side menu both hardcoded 2026,
 * which silently becomes wrong every January.
 */
export const YEAR = new Date().getFullYear()

export const SEO_TITLE_TEMPLATE = `%s | ${BRAND.name}`
export const SEO_DEFAULT_TITLE = `${BRAND.name} — ${BRAND.tagline}`

/** Build an absolute URL from a site-relative path. */
export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`

/** Canonical URL for a product. */
export const productUrl = (handle: string) => `/product/${handle}/`

/** Canonical URL for a blog post / page (flat at root). */
export const postUrl = (slug: string) => `/${slug}/`

/** Format a PKR amount the Pakistani way (e.g. Rs 1,500). */
export const formatPKR = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("PKR", "Rs")
    .trim()
