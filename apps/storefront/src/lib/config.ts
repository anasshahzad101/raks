import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"
import { snapshotFetch } from "@lib/catalog-snapshot"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

/**
 * Serve the catalog from the committed JSON snapshot instead of the Medusa API.
 * Enables building and running the storefront with no backend (see
 * `src/lib/catalog-snapshot.ts`). Cart/customer/checkout still go over HTTP.
 *
 * Defaults to ON: opting in by exact string was too fragile. If the host's BUILD
 * environment lacked the variable, every catalog read silently fell through to
 * an absent backend — products 404'd, rails vanished and the sitemap shrank —
 * because every caller degrades rather than throwing. Set the variable to
 * "false" to go back to a live Medusa backend.
 */
const USE_CATALOG_SNAPSHOT =
  process.env.NEXT_PUBLIC_USE_CATALOG_SNAPSHOT !== "false"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  // Read-only catalog reads are answered locally; anything the snapshot does
  // not model (cart, customer, checkout) falls through to the real backend.
  if (USE_CATALOG_SNAPSHOT && typeof input === "string") {
    const method = (init?.method ?? "GET").toUpperCase()
    if (method === "GET") {
      const result = snapshotFetch(input, (init?.query as any) ?? {})
      if (result !== undefined) {
        return result as T
      }
    }
  }

  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }
  init = {
    ...init,
    headers: newHeaders,
  }
  return originalFetch(input, init)
}
