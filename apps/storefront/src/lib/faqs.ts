/**
 * FAQ content used for visible accordions and FAQPage (schema.org) structured
 * data. FAQPage markup is a strong AEO signal — AI answer engines (ChatGPT,
 * Perplexity, Gemini, Google AI Overviews) extract these Q&As directly.
 */

export type Faq = { question: string; answer: string }

/** Store-wide FAQs (shipping, payment, returns, sizing). Used on /faqs. */
export const storeFaqs: Faq[] = [
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer:
      "Yes. Raks offers Cash on Delivery across Pakistan, so you can pay in cash when your order is delivered to your door.",
  },
  {
    question: "How much does delivery cost and how long does it take?",
    answer:
      "We deliver nationwide across Pakistan. Delivery is free on orders over Rs 3,000, and orders typically arrive within 3–5 business days.",
  },
  {
    question: "Is the packaging discreet?",
    answer:
      "Yes. Every order is shipped in plain, unbranded packaging so your purchase stays completely private.",
  },
  {
    question: "Can I return or exchange an item?",
    answer:
      "Yes. If the fit isn't right, you can exchange your item for a different size or return it for a refund, as long as it is unworn with the tags intact.",
  },
  {
    question: "How do I choose the right size?",
    answer:
      "Each product page lists the available sizes. If you are between sizes or unsure, message us and our team will help you pick the best fit.",
  },
  {
    question: "Are the products true to size?",
    answer:
      "Our pieces are designed for true-to-size, comfortable fits. The exact size options are shown on every product page.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD) across Pakistan. Any additional online payment options are shown at checkout.",
  },
  {
    question: "Are your products original and good quality?",
    answer:
      "Yes. Raks offers premium lingerie, nightwear and shapewear made from quality fabrics, chosen for comfort and durability.",
  },
]

/**
 * Category-relevant FAQs, lightly tailored with the category name so each page
 * gets unique, accurate Q&A copy (avoids duplicate boilerplate across pages).
 */
export function getCategoryFaqs(name: string): Faq[] {
  const n = name
  const lower = n.toLowerCase()
  return [
    {
      question: `What sizes are available in ${n}?`,
      answer: `Our ${lower} range comes in a variety of sizes. The available sizes for each piece are shown on its product page — just select your size before adding to cart.`,
    },
    {
      question: `Is Cash on Delivery available for ${n}?`,
      answer: `Yes. You can order any ${lower} with Cash on Delivery (COD) anywhere in Pakistan and pay when your order arrives.`,
    },
    {
      question: `How long does delivery take?`,
      answer: `We deliver ${lower} nationwide across Pakistan, usually within 3–5 business days. Delivery is free on orders over Rs 3,000.`,
    },
    {
      question: `Can I exchange ${n} if the size doesn't fit?`,
      answer: `Yes. If your ${lower} doesn't fit, you can exchange it for a different size or return it for a refund, as long as it is unworn with tags intact.`,
    },
    {
      question: `Is the packaging discreet?`,
      answer: `Absolutely. Every ${lower} order is shipped in plain, discreet packaging to keep your purchase private.`,
    },
  ]
}
