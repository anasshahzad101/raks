/**
 * Turns a flat, unstructured plain-text description (common in migrated /
 * AI-generated SEO copy) into readable HTML paragraphs.
 *
 * It can't perfectly recover headings that were flattened into prose, but it:
 *  - splits the intro into paragraphs (~3 sentences each)
 *  - pulls out an "FAQs" section as a heading
 *  - puts each "Q1: …", "Q2: …" on its own line with the question bolded
 *
 * Real HTML content should NOT be passed here — it's only for plain text.
 */

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

export const plainTextToHtml = (raw: string): string => {
  const text = raw.replace(/\s+/g, " ").trim()

  // Short copy: leave it as a single paragraph.
  if (text.length < 240) {
    return `<p>${escapeHtml(text)}</p>`
  }

  const blocks: string[] = []

  // Separate an FAQ section if present.
  let intro = text
  let faq = ""
  const faqIdx = text.search(/\bFAQ/i)
  if (faqIdx > -1) {
    intro = text.slice(0, faqIdx).trim()
    faq = text.slice(faqIdx).trim()
  }

  // Intro → paragraphs of ~3 sentences.
  const sentences = intro.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [intro]
  let buf: string[] = []
  sentences.forEach((s) => {
    buf.push(s.trim())
    if (buf.length >= 3) {
      blocks.push(`<p>${escapeHtml(buf.join(" "))}</p>`)
      buf = []
    }
  })
  if (buf.length) {
    blocks.push(`<p>${escapeHtml(buf.join(" "))}</p>`)
  }

  // FAQ → heading + one paragraph per question.
  if (faq) {
    const qStart = faq.search(/Q\s*1\s*[:.]/i)
    let faqHeading = faq
    let questions = ""
    if (qStart > -1) {
      faqHeading = faq.slice(0, qStart).trim()
      questions = faq.slice(qStart).trim()
    }

    if (faqHeading) {
      blocks.push(`<h3>${escapeHtml(faqHeading)}</h3>`)
    }

    if (questions) {
      questions
        .split(/(?=Q\s*\d+\s*[:.])/i)
        .map((q) => q.trim())
        .filter(Boolean)
        .forEach((item) => {
          const m = item.match(/^(Q\s*\d+\s*[:.])\s*(.*)$/i)
          if (m) {
            blocks.push(
              `<p><strong>${escapeHtml(m[1])}</strong> ${escapeHtml(m[2])}</p>`
            )
          } else {
            blocks.push(`<p>${escapeHtml(item)}</p>`)
          }
        })
    }
  }

  return blocks.join("")
}
