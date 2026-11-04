import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache"

/**
 * Serves prerendered pages exactly as the build produced them. The cache is
 * read-only, which only suits snapshot mode, where the catalogue is fixed at
 * build time anyway. In live mode (NEXT_PUBLIC_USE_CATALOG_SNAPSHOT=false) pages
 * would keep build-time prices until the next deploy, so swap this for a cache
 * that can revalidate first: https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
})
