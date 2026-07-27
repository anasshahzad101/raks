import { Metadata } from "next"
import FaqSection from "@modules/common/components/faq-section"
import { storeFaqs } from "@lib/faqs"
import { BRAND, absoluteUrl } from "@lib/raks"

export const metadata: Metadata = {
  title: { absolute: `FAQs — Shipping, Sizing & Returns | ${BRAND.name}` },
  description:
    "Frequently asked questions about Raks: Cash on Delivery across Pakistan, free delivery over Rs 3,000, sizing help, discreet packaging, and easy returns & exchanges.",
  alternates: { canonical: absoluteUrl("/faqs/") },
}

export default function FaqsPage() {
  return (
    <div className="content-container py-10 small:py-16">
      <div className="mb-8 flex flex-col gap-y-3">
        <nav className="text-xs uppercase tracking-luxe text-ink/50">Help</nav>
        <h1 className="font-display text-4xl text-ink small:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="max-w-2xl text-ink/60">
          Everything you need to know about ordering from Raks — delivery,
          payment, sizing, packaging and returns across Pakistan.
        </p>
      </div>

      <FaqSection faqs={storeFaqs} title="" className="max-w-3xl" />
    </div>
  )
}
