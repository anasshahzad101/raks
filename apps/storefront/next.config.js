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
