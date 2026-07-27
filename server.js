/**
 * Startup file for managed Node.js hosts.
 *
 * Some hosts (Passenger-style, and Hostinger's "Other" framework mode) boot an
 * application by running an entry FILE rather than an npm start command, so
 * `npm start` — and therefore `next start` — never runs and nothing binds the
 * port. This file gives those hosts something to execute.
 *
 * It boots Next.js from apps/storefront while running with the repository root
 * as the working directory, which is why the catalog snapshot loader resolves
 * its JSON against both cwd layouts (see src/lib/catalog-snapshot.ts).
 *
 * Hosts that accept a start command do not need this — `npm start` already
 * works and honours $PORT.
 */
const { createServer } = require("node:http")
const path = require("node:path")
const next = require("next")

const port = parseInt(process.env.PORT || "8000", 10)
const hostname = process.env.HOSTNAME || "0.0.0.0"

// Resolve the app regardless of whether this file is run from the repo root or
// from apps/storefront itself.
const dir = path.join(__dirname, "apps", "storefront")

const app = next({ dev: false, dir })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
      console.log(`> Raks storefront ready on http://${hostname}:${port}`)
    })
  })
  .catch((err) => {
    console.error("Failed to start the Next.js server:", err)
    process.exit(1)
  })
