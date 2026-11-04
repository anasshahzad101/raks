/**
 * Copies the catalog snapshot into the Worker's static assets.
 *
 * lib/catalog-snapshot.ts reads these at runtime on Cloudflare, where there is
 * no disk. Paths under cdn-cgi/ are reachable by the Worker but not by visitors.
 * Run after `opennextjs-cloudflare build`, which clears .open-next first.
 */
import { copyFileSync, mkdirSync, readdirSync } from "node:fs"
import path from "node:path"

const from = path.join("src", "content", "catalog")
const to = path.join(".open-next", "assets", "cdn-cgi", "catalog")

mkdirSync(to, { recursive: true })

const files = readdirSync(from).filter((file) => file.endsWith(".json"))
for (const file of files) copyFileSync(path.join(from, file), path.join(to, file))

console.log(`copied ${files.length} catalog files to ${to}`)
