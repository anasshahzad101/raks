/**
 * Where product images actually live, and how to point at them.
 *
 * The images are files in the storefront repo, served from `public/media` on
 * raks.pk. Medusa has no copy of them and no file provider configured — half a
 * gigabyte of images is not something to push into the backend's container
 * image.
 *
 * That is fine for the storefront, which resolves `/media/…` against its own
 * origin. It is not fine for the Medusa admin, which runs on
 * `raks-production.up.railway.app`: the browser resolves the same relative path
 * against *that* host, where nothing is served, and every product image renders
 * broken. Verified: the path returns 200 and a 197KB webp on raks.pk, and 404
 * on the Railway domain.
 *
 * So urls are stored absolute. The source file `data/medusa-products.json`
 * stays relative on purpose — it is the human-editable one, and baking a domain
 * into 727 entries would make changing the domain an edit of all of them. The
 * conversion happens on the way into Medusa instead.
 *
 * The storefront's `absoluteUrl()` ignores input that is already absolute, so
 * the Product schema and OpenGraph tags keep working with these.
 */

/** Override if the storefront ever moves. Without a scheme it is ignored. */
const configured = (process.env.STOREFRONT_URL ?? "").trim()

export const STOREFRONT_URL = /^https?:\/\//i.test(configured)
  ? configured.replace(/\/+$/, "")
  : "https://raks.pk"

/**
 * Point a stored image url at the storefront.
 *
 * Absolute urls pass through untouched, so this is safe to run repeatedly and
 * safe on a catalogue that is already half-converted. Anything falsy stays
 * falsy rather than becoming a link to the homepage.
 */
export function toAbsoluteMediaUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${STOREFRONT_URL}${url.startsWith("/") ? url : `/${url}`}`;
}
