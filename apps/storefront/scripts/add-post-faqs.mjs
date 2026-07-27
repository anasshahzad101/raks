// Adds structured `faqs` (for FAQPage schema) to the AEO guide posts.
// Idempotent: re-running just overwrites the faqs field. Text matches the
// visible FAQ Q&As already in each post's content.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const file = join(__dirname, "..", "src", "content", "blog.json")
const posts = JSON.parse(readFileSync(file, "utf8"))

const faqsBySlug = {
  "silk-vs-cotton-nighty": [
    {
      question: "Is silk or cotton better for summer in Pakistan?",
      answer:
        "Cotton is more breathable and absorbent, making it the better everyday choice for hot, humid weather — though silk's natural temperature regulation also keeps you cool.",
    },
    {
      question: "Is silk hard to maintain?",
      answer:
        "Silk needs gentle hand washing in cool water and air drying, but with basic care it lasts beautifully for years.",
    },
    {
      question: "Which is better for sensitive skin?",
      answer:
        "Both are skin-friendly. Cotton is hypoallergenic and great for sensitive skin, while pure silk is naturally smooth and non-irritating.",
    },
  ],
  "how-to-choose-nightwear-fabric": [
    {
      question: "Which nightwear fabric is best for hot weather?",
      answer:
        "Cotton and jersey are the most breathable, making them ideal for Pakistan's warm, humid nights.",
    },
    {
      question: "Which fabric is best for a bridal nighty?",
      answer:
        "Silk, lace and net are the most popular for bridal and honeymoon nightwear thanks to their elegant, romantic feel.",
    },
  ],
  "types-of-nighties-guide": [
    {
      question: "Which type of nighty is best for everyday use?",
      answer:
        "Cotton nighties, long nighties and cami sets are the most practical and comfortable for daily wear.",
    },
    {
      question: "Which nighty is best for a bride?",
      answer:
        "Silk and lace bridal nighties and babydolls are the most popular choices for the wedding night.",
    },
    {
      question: "What is a babydoll nighty?",
      answer:
        "A babydoll is a short, loose-fitting nighty — often sheer with lace or net detailing — usually paired with a matching panty.",
    },
  ],
  "how-to-measure-bra-size-at-home": [
    {
      question: "How do I measure my bra size without a measuring tape?",
      answer:
        "Use a piece of string or a phone charging cable to wrap around, mark the length, then measure it against a ruler.",
    },
    {
      question: "What if I'm between sizes?",
      answer:
        "If your band measurement is an odd number, round down for a snugger fit or up for more comfort, and adjust the cup accordingly (sister sizing).",
    },
    {
      question: "How often should I re-measure?",
      answer:
        "Re-measure every 6–12 months, or after any noticeable weight change, pregnancy or breastfeeding.",
    },
  ],
}

let patched = 0
for (const p of posts) {
  if (faqsBySlug[p.slug]) {
    p.faqs = faqsBySlug[p.slug]
    patched++
  }
}

writeFileSync(file, JSON.stringify(posts, null, 0))
console.log(`Patched faqs on ${patched} posts.`)
