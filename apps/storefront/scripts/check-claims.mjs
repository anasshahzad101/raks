#!/usr/bin/env node
/**
 * Claim consistency check.
 *
 * The store's promises — delivery window, free-delivery threshold, exchange
 * window, payment methods, packaging — were retyped by hand across page copy,
 * FAQ answers, category descriptions, landing pages, llms.txt and agents.md.
 * They had already drifted apart in several places at once:
 *
 *   - the product page promised dispatch in "1–2 days" while the FAQ said
 *     3 to 5 business days
 *   - the Terms page promised 30-day returns with refunds to the original
 *     payment method, on a Cash on Delivery store, while the homepage promised
 *     a 15-day size exchange
 *   - the footer advertised Visa, Mastercard, Easypaisa and JazzCash when only
 *     Cash on Delivery is wired up
 *
 * Each of those was found by reading. This script finds them by running.
 *
 * Usage:  node scripts/check-claims.mjs
 * Exits non-zero when a claim contradicts the values in src/lib/raks.ts.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/* ---------------------------------------------------------------- expected */
// Read the canonical values straight out of the config, so this script cannot
// drift from POLICY either.
const raksSrc = fs.readFileSync(path.join(root, "src/lib/raks.ts"), "utf8")
const readNum = (key) => {
  const m = raksSrc.match(new RegExp(`${key}:\\s*(\\d+)`))
  return m ? Number(m[1]) : null
}

const EXPECTED = {
  freeDeliveryThreshold: readNum("freeDeliveryThreshold"),
  deliveryDaysMin: readNum("deliveryDaysMin"),
  deliveryDaysMax: readNum("deliveryDaysMax"),
  exchangeWindowDays: readNum("exchangeWindowDays"),
}

/* ------------------------------------------------------------------ inputs */
const FILES = [
  "src/lib/faqs.ts",
  "src/lib/category-copy.ts",
  "src/lib/landing-pages.ts",
  "src/content/pages.json",
  "src/content/catalog/categories.json",
  "src/content/catalog/products.json",
  "src/content/blog.json",
  "public/llms.txt",
  "public/agents.md",
  "src/app/(main)/page.tsx",
  "src/app/(main)/faqs/page.tsx",
  "src/modules/products/templates/index.tsx",
  "src/modules/layout/templates/nav/index.tsx",
  "src/modules/layout/templates/footer/index.tsx",
  "src/modules/checkout/components/express-checkout/index.tsx",
]

/* ------------------------------------------------------------------- rules */
// Each rule flags text that asserts something other than the canonical value.
// `allow` skips matches that are actually correct.
const RULES = [
  {
    name: "delivery window",
    // any "N-M business day(s)" that is not the configured window
    pattern: /(\d+)\s*[–-]\s*(\d+)\s*(?:business|working) days?/gi,
    check: (m) =>
      Number(m[1]) !== EXPECTED.deliveryDaysMin ||
      Number(m[2]) !== EXPECTED.deliveryDaysMax,
    expected: () =>
      `${EXPECTED.deliveryDaysMin}–${EXPECTED.deliveryDaysMax} business days`,
  },
  {
    name: "dispatch time",
    // "ships in N days" style claims, which are not a policy value at all
    pattern: /ships? in \d+\s*[–-]?\s*\d*\s*days?/gi,
    check: () => true,
    expected: () => "no dispatch promise; use the delivery window",
  },
  {
    name: "free delivery threshold",
    pattern: /(?:over|above)\s*(?:Rs\.?|PKR|₨)\s*([\d,]+)/gi,
    // Only a threshold if the surrounding sentence is about delivery. Editorial
    // copy uses "above Rs 5,000" to describe what a product costs.
    check: (m, line) => {
      const near = line.slice(Math.max(0, m.index - 90), m.index + 90)
      if (!/deliver|shipping|free/i.test(near)) return false
      return Number(m[1].replace(/,/g, "")) !== EXPECTED.freeDeliveryThreshold
    },
    expected: () => `Rs ${EXPECTED.freeDeliveryThreshold.toLocaleString("en-US")}`,
  },
  {
    name: "exchange window",
    pattern: /(\d+)[\s-]*days? (?:of delivery|size exchange|to exchange)/gi,
    check: (m) => Number(m[1]) !== EXPECTED.exchangeWindowDays,
    expected: () => `${EXPECTED.exchangeWindowDays} days`,
  },
  {
    name: "refund promise",
    // The store is Cash on Delivery and the published policy is a size
    // exchange. "Refund to the original payment method" cannot apply.
    pattern: /refund(?:ed|s)?(?:\s+to\s+the\s+original\s+payment\s+method)?/gi,
    check: (m) => /original payment method/i.test(m[0]),
    expected: () => "exchange only, until a refund process is confirmed",
  },
  {
    name: "unsupported payment method",
    pattern: /\b(Easypaisa|JazzCash|Mastercard|Visa)\b/gi,
    // Only where the site speaks for itself. A Journal post explaining which
    // payment methods are safe when shopping online in Pakistan is not RAKS
    // claiming to accept them.
    skipFiles: [/content[\\/]blog\.json$/],
    check: () => true,
    expected: () => "Cash on Delivery is the only method checkout completes",
  },
  {
    name: "currency format",
    // "PKR 1,234.00" style, or the ₨ glyph. The site formats prices as "Rs 1,234".
    // Requires a digit immediately after the symbol: "under 2000 PKR," is
    // ordinary prose, whereas "PKR 2,000" and "₨2,000" are the wrong format.
    pattern: /(?:PKR\s*\d[\d,]*(?:\.\d+)?|₨\s*\d[\d,]*)/g,
    check: () => true,
    note: "prose may write '2000 PKR'; only a leading PKR or ₨ is flagged",
    expected: () => 'formatted as "Rs 1,234"',
  },
  {
    name: "health claim",
    pattern: /(weight loss|burn fat|reduce belly fat|fat loss|pre-baby|posture support)/gi,
    // The shapewear FAQ legitimately says shapewear does NOT do these things.
    check: (m, line) => !/\bnot?\b|does not|doesn|No\./i.test(line),
    expected: () => "describe compression, not physiological change",
  },
  {
    name: "template company data",
    pattern: /(Nuevo Altata|luxelingerieco|Elegance Street|London Eye|\+44 1234|1800956)/gi,
    check: () => true,
    expected: () => "removed — this is another company's data",
  },
]

/* ------------------------------------------------------------------- runner */

/**
 * Blank out comments while preserving line numbers.
 *
 * Several comments in this codebase exist specifically to record that a claim
 * was removed — "the badges previously also advertised Easypaisa, JazzCash,
 * Visa and Mastercard". Flagging those as violations would train everyone to
 * ignore this script, so they are excluded. Matching line-by-line is not enough
 * because those comments wrap across several lines and the offending words sit
 * on a continuation line that carries no comment marker of its own.
 */
const stripComments = (text) =>
  text
    // /* ... */ and JSX {/* ... */}, across lines
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, (m) => m.replace(/[^\n]/g, " "))
    // // ... to end of line
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length))

let problems = 0
const findings = []

for (const rel of FILES) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) continue
  const lines = stripComments(fs.readFileSync(abs, "utf8")).split("\n")

  for (const rule of RULES) {
    if (rule.skipFiles?.some((re) => re.test(rel))) continue
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      rule.pattern.lastIndex = 0
      let m
      while ((m = rule.pattern.exec(line)) !== null) {
        if (!rule.check(m, line)) continue
        findings.push({
          file: rel,
          line: i + 1,
          rule: rule.name,
          found: m[0].trim().slice(0, 60),
          expected: rule.expected(),
        })
        problems++
      }
    }
  }
}

/* ------------------------------------------------------------------ report */
console.log("Claim consistency check")
console.log("=".repeat(60))
console.log(
  `Canonical values: delivery ${EXPECTED.deliveryDaysMin}–${EXPECTED.deliveryDaysMax} business days · ` +
    `free over Rs ${EXPECTED.freeDeliveryThreshold} · ` +
    `${EXPECTED.exchangeWindowDays}-day exchange`
)
console.log("")

if (!findings.length) {
  console.log("No contradictions found across " + FILES.length + " files.")
  process.exit(0)
}

const byRule = {}
for (const f of findings) (byRule[f.rule] ??= []).push(f)

for (const [rule, items] of Object.entries(byRule)) {
  console.log(`${rule}  (${items.length})`)
  console.log(`   should be: ${items[0].expected}`)
  for (const it of items.slice(0, 8)) {
    console.log(`   ${it.file}:${it.line}  "${it.found}"`)
  }
  if (items.length > 8) console.log(`   ...and ${items.length - 8} more`)
  console.log("")
}

console.log(`${problems} claim(s) need review.`)
process.exit(1)
