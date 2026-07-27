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
  email: "info@raks.pk",
  // social handles (fill in if/when known)
  instagram: "https://www.instagram.com/raks.pk/",
  facebook: "https://www.facebook.com/raks.pk/",
} as const

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
