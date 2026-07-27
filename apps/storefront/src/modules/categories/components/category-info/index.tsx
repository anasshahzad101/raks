"use client"

import { useState } from "react"
import { Faq } from "@lib/faqs"
import RichText from "@modules/common/components/rich-text"

/**
 * The category page's bottom block, matching the reference: two equal columns —
 * "About the collection" (the long-form SEO description, left) and "Frequently
 * asked questions" (right) — sharing one consistent design (gold eyebrows,
 * Cormorant headings, cream-300 dividers). Emits FAQPage JSON-LD for AEO.
 */
export default function CategoryInfo({
  heading,
  description,
  faqs,
}: {
  heading: string
  description?: string | null
  faqs: Faq[]
}) {
  const [expanded, setExpanded] = useState(false)

  const hasDescription = Boolean(description)
  const hasFaqs = faqs?.length > 0
  if (!hasDescription && !hasFaqs) return null
  const twoUp = hasDescription && hasFaqs

  const faqLd = hasFaqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null

  const eyebrow = "text-[11px] uppercase tracking-[0.24em] text-gold mb-4"
  const columnHeading =
    "font-display font-medium text-[28px] small:text-[34px] leading-[1.15] text-ink"

  return (
    <section
      className={`mt-16 border-t border-cream-300 pt-12 small:mt-20 small:pt-[52px] ${
        twoUp
          ? "grid grid-cols-1 items-start gap-y-12 small:grid-cols-2 small:gap-x-16"
          : "max-w-3xl"
      }`}
    >
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      {/* About the collection */}
      {hasDescription && (
        <div className="category-about">
          <div className={eyebrow}>About the collection</div>
          <h2 className={`${columnHeading} mb-6`}>{heading}</h2>
          <div className="relative">
            <div
              className={
                expanded ? "" : "relative max-h-[230px] overflow-hidden"
              }
            >
              <RichText content={description} />
              {!expanded && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cream to-transparent" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-5 text-[11px] uppercase tracking-[0.16em] text-gold-deep underline underline-offset-4 transition-colors hover:text-accent"
            >
              {expanded ? "Read less −" : "Read more +"}
            </button>
          </div>
        </div>
      )}

      {/* Frequently asked questions */}
      {hasFaqs && (
        <div>
          <div className={eyebrow}>Good to know</div>
          <h2 className={`${columnHeading} mb-5`}>Frequently asked questions</h2>
          <div className="border-t border-cream-300">
            {faqs.map((f, i) => (
              <details key={i} className="group border-b border-cream-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15px] font-medium leading-[1.4] text-ink">
                  <span>{f.question}</span>
                  <span className="shrink-0 text-[22px] leading-none text-gold transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[520px] pb-5 text-[14px] font-light leading-[1.85] text-[#5c4d42]">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
