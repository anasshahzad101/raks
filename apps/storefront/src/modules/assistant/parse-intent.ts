/**
 * Turn a shopper's typed message into something the assistant can act on.
 *
 * The assistant is deliberately rule-based rather than a language model, so a
 * typed message has to be read with keywords. That is a real limitation and it
 * is handled honestly: when nothing is recognised, the assistant says so and
 * offers the buttons rather than guessing and showing the wrong products.
 */

export type Intent =
  | { kind: "faq"; topic: "delivery" | "payment" | "exchange" | "packaging" | "size" }
  | { kind: "human" }
  | { kind: "order" }
  | {
      kind: "search"
      cats: string[]
      occasion: string
      fabric: string
      max: number
      size: string
      color: string
    }
  | { kind: "unknown" }

const has = (t: string, ...words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}`, "i").test(t))

/** Category words a shopper actually types, mapped to catalogue handles. */
const CATEGORY_WORDS: [RegExp, string[]][] = [
  [/t.?shirt bra/i, ["t-shirt-bra"]],
  [/push.?up/i, ["push-up-bra"]],
  [/sports? bra|gym bra/i, ["sports-bra"]],
  [/nursing|maternity|feeding/i, ["nursing-and-maternity-bras"]],
  [/minimi[sz]er/i, ["minimizer-bra"]],
  [/non.?padded|non.?wired|wireless/i, ["non-padded-bra"]],
  [/padded/i, ["padded-bra"]],
  [/bridal bra|wedding bra/i, ["bridal-bra", "bridal-bra-sets"]],
  [/\bbras?\b|brasserie|brazier/i, ["bras"]],
  [/pyjama|pajama|\bpj\b|night suit/i, ["pyjama"]],
  [/shapewear|body ?shaper|tummy|waist trainer|shaper/i, ["shapewear"]],
  [/pant(y|ies)|underwear|brief|thong|knicker/i, ["panties"]],
  [/nighty|nighties|nightdress|night dress|nightgown|nightwear|gown/i, ["nightwear"]],
]

const FABRIC_WORDS: [RegExp, string][] = [
  [/cotton|linen|jersey/i, "cotton"],
  [/silk|satin|silky/i, "satin"],
  [/lace|net|mesh/i, "lace"],
]

const OCCASION_WORDS: [RegExp, string][] = [
  [/bridal|wedding|dulhan|shaadi|nikah/i, "bridal"],
  [/honeymoon|first night/i, "honeymoon"],
  [/everyday|daily|regular|normal|routine/i, "everyday"],
  [/sports?|gym|workout|running/i, "sports"],
  [/nursing|maternity|feeding|pregnan/i, "nursing"],
  [/party|fancy|evening/i, "party"],
  [/teen|teenager|first bra|training bra|beginner/i, "teen"],
]

const COLOUR_WORDS =
  /\b(black|white|red|beige|skin|nude|pink|blue|navy|green|maroon|burgundy|purple|grey|gray|brown|coffee|teal|ivory|peach)\b/i

/** "under 2000", "below rs 1500", "less than 3000", "budget 1000" */
const priceCap = (t: string): number => {
  const m =
    t.match(/(?:under|below|less than|max|upto|up to|within|budget(?: of)?)\s*(?:rs\.?|pkr|₨)?\s*([\d,]{3,7})/i) ??
    t.match(/(?:rs\.?|pkr|₨)\s*([\d,]{3,7})\s*(?:or less|max|budget)/i)
  if (!m) return Infinity
  const n = Number(m[1].replace(/,/g, ""))
  return Number.isFinite(n) && n > 0 ? n : Infinity
}

/** "34b", "32 c", "medium", "xl" */
const sizeToken = (t: string): string => {
  const band = t.match(/\b(\d{2})\s?([a-f])\b/i)
  if (band) return `${band[1]}${band[2].toUpperCase()}`
  const bandOnly = t.match(/\bsize\s*(\d{2})\b/i)
  if (bandOnly) return bandOnly[1]
  const letter = t.match(/\b(xxl|xl|large|medium|small|xs)\b/i)
  return letter ? letter[1].toLowerCase() : ""
}

export const parseIntent = (input: string): Intent => {
  const t = String(input ?? "").trim()
  if (!t) return { kind: "unknown" }

  // A request for a person beats everything else.
  if (has(t, "human", "person", "agent", "someone", "representative", "call me", "whatsapp", "talk to"))
    return { kind: "human" }

  if (has(t, "order", "buy now", "checkout", "place an order", "how do i order"))
    return { kind: "order" }

  // Policy questions, checked before product search so "delivery charges for
  // bras" is answered rather than turned into a bra search.
  if (has(t, "deliver", "shipping", "courier", "how long", "when will", "arrive"))
    return { kind: "faq", topic: "delivery" }
  if (has(t, "cod", "cash on delivery", "payment", "pay", "card", "easypaisa", "jazzcash"))
    return { kind: "faq", topic: "payment" }
  if (has(t, "exchange", "return", "refund", "swap"))
    return { kind: "faq", topic: "exchange" }
  if (has(t, "packag", "discreet", "privacy", "private", "box", "wrapped"))
    return { kind: "faq", topic: "packaging" }
  if (has(t, "size guide", "measure", "what size", "which size", "fitting", "size chart"))
    return { kind: "faq", topic: "size" }

  const cats = CATEGORY_WORDS.find(([re]) => re.test(t))?.[1] ?? []
  const fabric = FABRIC_WORDS.find(([re]) => re.test(t))?.[1] ?? ""
  const occasion = OCCASION_WORDS.find(([re]) => re.test(t))?.[1] ?? ""
  const max = priceCap(t)
  const size = sizeToken(t)
  const color = (t.match(COLOUR_WORDS)?.[1] ?? "").toLowerCase()

  // Only treat it as a search when something concrete was recognised.
  if (cats.length || fabric || occasion || size || color || max !== Infinity)
    return { kind: "search", cats, occasion, fabric, max, size, color }

  return { kind: "unknown" }
}
