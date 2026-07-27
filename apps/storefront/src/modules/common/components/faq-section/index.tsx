import { Faq } from "@lib/faqs"

/**
 * Renders a visible FAQ accordion (native <details> — accessible, no JS needed,
 * content stays in the DOM for crawlers) plus FAQPage JSON-LD for AEO.
 */
const FaqSection = ({
  faqs,
  title = "Frequently Asked Questions",
  className = "",
}: {
  faqs: Faq[]
  title?: string
  className?: string
}) => {
  if (!faqs?.length) {
    return null
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }

  return (
    <section className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <h2 className="mb-6 font-display text-2xl text-ink small:text-3xl">
        {title}
      </h2>
      <div className="border-t border-bronze-100">
        {faqs.map((f, i) => (
          <details key={i} className="group border-b border-bronze-100 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-ink">
              <span className="font-medium">{f.question}</span>
              <span className="text-xl leading-none text-bronze-500 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink/70">
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default FaqSection
