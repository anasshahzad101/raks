/**
 * Fails the build early when a required environment variable is missing.
 *
 * Loaded from next.config.js, so it runs during BOTH `next build` and
 * `next start`. It therefore must not require anything outside `dependencies`:
 * managed hosts frequently prune devDependencies after the build step, and a
 * devDependency here would crash the app at startup with MODULE_NOT_FOUND.
 * Plain strings only — no colour library.
 */

const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys",
  },
]

/**
 * The catalog snapshot serves every catalog read locally, so no key is needed to
 * build or run the site. Hard-exiting on it in that mode only turns a missing
 * host env var into an opaque failed deploy (and, because next.config.js is also
 * loaded by `next start`, into a site that will not boot after a restart).
 */
const usingCatalogSnapshot =
  process.env.NEXT_PUBLIC_USE_CATALOG_SNAPSHOT !== "false"

function checkEnvVariables() {
  if (usingCatalogSnapshot) {
    return
  }

  const missingEnvs = requiredEnvs.filter(function (env) {
    return !process.env[env.key]
  })

  if (missingEnvs.length > 0) {
    console.error("\nError: Missing required environment variables\n")

    missingEnvs.forEach(function (env) {
      console.error(`  ${env.key}`)
      if (env.description) {
        console.error(`    ${env.description}\n`)
      }
    })

    console.error(
      "\nPlease set these variables in your .env file or environment before starting the application.\n"
    )

    process.exit(1)
  }
}

module.exports = checkEnvVariables
