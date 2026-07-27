import pg from "pg"
import { readFileSync } from "fs"

const cats = JSON.parse(readFileSync("src/data/medusa-categories.json", "utf8"))
const decode = (s) =>
  (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()

const c = new pg.Client({ host: "localhost", port: 5432, user: "medusa", password: "medusa", database: "raks_medusa" })
await c.connect()
let n = 0
for (const cat of cats) {
  const r = await c.query("UPDATE product_category SET description=$1 WHERE handle=$2", [decode(cat.description), cat.handle])
  n += r.rowCount
}
const check = await c.query("SELECT count(*)::int AS n FROM product_category WHERE description LIKE '%â%'")
console.log("Updated", n, "categories | remaining mojibake:", check.rows[0].n)
await c.end()
