export type ParsedFaq = { question: string; answer: string }

// Where the FAQ block starts inside a migrated category description.
const FAQ_MARKER = /\b(FAQs?|Frequently\s+Asked\s+Questions)\b/i
// Start of each Q&A item: "Q:", "Q.", "Q -", or a number ("1.", "2)").
const ITEM_MARKER = /(?:^|\s)(?:Q\s*[:.\-]|\d{1,2}\s*[.)])\s*/gi
// A trailing, unmarked "…. Question? answer" tacked onto an answer.
const TRAILING_Q = /^(.+?[.!?])\s+([A-Z][^?]{8,140}\?)\s+([A-Z].+)$/s

const tidy = (s: string) => s.replace(/\s+/g, " ").trim()

// Peel any trailing unmarked "Question? answer" chains off an answer so they
// become their own FAQ entries (e.g. the "What is the bra price in Pakistan?"
// tail that the source appends after the last labelled question).
function splitTrailing(question: string, answer: string): ParsedFaq[] {
  const m = answer.match(TRAILING_Q)
  if (!m) return [{ question, answer }]
  return [{ question, answer: tidy(m[1]) }, ...splitTrailing(tidy(m[2]), tidy(m[3]))]
}

/**
 * Split a migrated category description into its prose body and the FAQ Q&A
 * pairs embedded at the end. The RAKS descriptions append an "FAQs" block
 * (either "Q:/A:"-labelled or numbered), which we lift out so the FAQ column
 * can show the real, specific questions and the description stays clean prose.
 *
 * If there is no recognisable FAQ block the whole thing is returned as `body`
 * with an empty `faqs`, so non-FAQ descriptions pass through untouched.
 */
export function parseCategoryContent(
  description?: string | null
): { body: string; faqs: ParsedFaq[] } {
  if (!description) return { body: "", faqs: [] }

  const marker = description.match(FAQ_MARKER)
  if (!marker || marker.index === undefined) {
    return { body: description.trim(), faqs: [] }
  }

  const body = description.slice(0, marker.index).trim()
  const faqText = description.slice(marker.index + marker[0].length)

  const markers = [...faqText.matchAll(ITEM_MARKER)]
  // Need at least two labelled items to be confident it's a real FAQ list;
  // otherwise keep the body and let the generic FAQ fallback apply.
  if (markers.length < 2) return { body, faqs: [] }

  const faqs: ParsedFaq[] = []
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index! + markers[i][0].length
    const end = i + 1 < markers.length ? markers[i + 1].index! : faqText.length
    const item = faqText.slice(start, end).trim()

    const qEnd = item.indexOf("?")
    if (qEnd === -1) continue

    const question = tidy(item.slice(0, qEnd + 1))
    const answer = tidy(item.slice(qEnd + 1).replace(/^A\s*[:.\-]\s*/i, ""))
    if (question.length < 6) continue

    faqs.push(...splitTrailing(question, answer))
  }

  return { body, faqs }
}
