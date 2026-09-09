const checkEnvVariables = require("./check-env-variables")
const legacyRedirects = require("./legacy-redirects.json")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Managed hosts that boot the app through Passenger run a startup FILE, and
  // their Next.js preset expects `.next/standalone/server.js`. Standalone also
  // ships a pruned node_modules, so the deployed app does not depend on the
  // workspace install being present.
  output: "standalone",
  // node_modules is hoisted to the monorepo root, so tracing must start there or
  // standalone would be built without its dependencies. This also silences the
  // "inferred workspace root" warning caused by lockfiles above the repo.
  outputFileTracingRoot: require("path").join(__dirname, "../.."),
  // Preserve the exact WooCommerce URL shape (every indexed URL ends with "/").
  trailingSlash: true,
  async redirects() {
    return [
      // legacy WooCommerce → new blog slugs (301, from the source site's Redirection plugin)
      ...legacyRedirects,
      // old WooCommerce route bases → new equivalents
      { source: "/product-tag/:slug/", destination: "/shop/", permanent: false },
      { source: "/my-account/:path*", destination: "/account", permanent: true },
      // WordPress media lives at the same relative path under /media/uploads/,
      // so every image URL Google indexed from the old site is recoverable
      // instead of 404ing.
      {
        source: "/wp-content/uploads/:path*",
        destination: "/media/uploads/:path*",
        permanent: true,
      },
    ]
  },
  // Baseline security headers. These are trust signals rather than ranking
  // factors, but the site previously sent none of them beyond the CSP that the
  // Hostinger CDN injects (`upgrade-insecure-requests`).
  //
  // Note: no full Content-Security-Policy here. The app loads Google Analytics
  // and the Meta Pixel, so a policy tight enough to be worth having needs a
  // nonce and per-source review, and a wrong one silently breaks analytics.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Two years, and only meaningful over HTTPS. Preload is deliberately
          // omitted: submitting to the preload list is effectively permanent
          // and should be the owner's decision.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Stop browsers guessing a response is a different type than declared.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking protection. The store is never framed by design.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Send the origin to other sites but the full path within our own, so
          // product URLs are not leaked to third parties in the Referer header.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Hardware APIs this storefront has no reason to use.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ]
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    qualities: [50, 75, 90, 100],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
