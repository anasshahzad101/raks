import pg from "pg"

/**
 * Fills product descriptions that are missing or too short. Descriptions are
 * generated from each product's (already descriptive) title — detecting fabric,
 * style and feature keywords — so every product reads naturally on its page.
 * Non-destructive: only touches rows with an empty/near-empty description.
 *
 *   node fill-descriptions.mjs           # write
 *   node fill-descriptions.mjs --dry     # preview without writing
 */

const DRY = process.argv.includes("--dry")

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const list = (arr) =>
  arr.length <= 1
    ? arr.join("")
    : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1]

function detect(title) {
  const t = title.toLowerCase()
  const has = (re) => re.test(t)

  let type = "piece"
  if (has(/sports bra/)) type = "sports bra"
  else if (has(/nursing|feeding|maternity/)) type = "nursing bra"
  else if (has(/bralette/)) type = "bralette"
  else if (has(/\bbra\b/)) type = "bra"
  else if (has(/night ?gown|nightgown/)) type = "nightgown"
  else if (has(/night ?dress|nighty|nightie|nightwear/)) type = "nightdress"
  else if (has(/night ?suit/)) type = "night suit"
  else if (has(/pyjama|pajama|\bpj\b/)) type = "pyjama set"
  else if (has(/\brobe\b|gown/)) type = "robe"
  else if (has(/cami/)) type = "cami set"
  else if (has(/thong|g[- ]?string/)) type = "thong"
  else if (has(/pant|knicker|brief|panty|panties/)) type = "brief"
  else if (has(/shapewear|shaper|body ?suit/)) type = "shaping piece"

  const fabrics = []
  if (has(/silk/)) fabrics.push("silk")
  if (has(/satin/)) fabrics.push("satin")
  if (has(/lace/)) fabrics.push("delicate lace")
  if (has(/cotton/)) fabrics.push("breathable cotton")
  if (has(/\bnet\b|mesh/)) fabrics.push("sheer net")
  if (has(/velvet/)) fabrics.push("soft velvet")
  if (has(/chiffon/)) fabrics.push("airy chiffon")
  if (has(/modal|jersey/)) fabrics.push("stretch modal")

  const features = []
  if (has(/embroider/)) features.push("fine embroidery")
  if (has(/padded/)) features.push("a gently padded shape")
  if (has(/push[- ]?up/)) features.push("a flattering push-up lift")
  if (has(/wired|underwire/)) features.push("supportive underwire")
  if (has(/wireless|non[- ]?wired|no underwire/)) features.push("a soft wireless fit")
  if (has(/backless|open back/)) features.push("an elegant open back")
  if (has(/slit/)) features.push("a graceful side slit")
  if (has(/strap|suspender/)) features.push("adjustable straps")
  if (has(/print|floral|panda|letter/)) features.push("a playful print")

  return { type, fabrics, features }
}

function generate(title) {
  const { type, fabrics, features } = detect(title)
  const clean = title.replace(/\s+/g, " ").trim()

  const fabricPhrase = fabrics.length
    ? `Crafted in ${list(fabrics)}, `
    : "Thoughtfully designed, "
  const featurePhrase = features.length
    ? ` with ${list(features)}`
    : ""

  const p1 = `${fabricPhrase}the ${clean} is a ${type} made to feel as beautiful as it looks${featurePhrase}. It brings together comfort and quiet confidence for everyday wear and special moments alike.`

  const p2 = `Soft against the skin, breathable and true to size, it is finished to the premium quality RAKS is loved for. Available in a range of sizes with Cash on Delivery across Pakistan, free delivery over Rs 3,000 and plain, discreet packaging.`

  return `<p>${cap(p1)}</p>\n<p>${p2}</p>`
}

const client = new pg.Client({
  host: "localhost",
  port: 5432,
  user: "medusa",
  password: "medusa",
  database: "raks_medusa",
})

await client.connect()

const { rows } = await client.query(
  `SELECT id, title FROM product
   WHERE deleted_at IS NULL
     AND (description IS NULL OR length(trim(description)) < 40)
   ORDER BY title`
)

console.log(`${rows.length} products need a description${DRY ? " (dry run)" : ""}\n`)

let n = 0
for (const p of rows) {
  const html = generate(p.title)
  if (DRY) {
    console.log(`• ${p.title}\n  ${html.replace(/<\/?p>/g, "").replace(/\n/g, "\n  ")}\n`)
  } else {
    await client.query("UPDATE product SET description = $1, updated_at = now() WHERE id = $2", [
      html,
      p.id,
    ])
  }
  n++
}

console.log(DRY ? `\nWould update ${n} products.` : `Updated ${n} products.`)
await client.end()
