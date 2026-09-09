/**
 * FAQ content used for visible accordions and FAQPage (schema.org) structured
 * data. FAQPage markup is a strong AEO signal — AI answer engines (ChatGPT,
 * Perplexity, Gemini, Google AI Overviews) extract these Q&As directly.
 */

import { POLICY, deliveryWindow, freeDeliveryThresholdLabel } from "./raks"

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
      `We deliver nationwide across Pakistan. Delivery is free on orders over ${freeDeliveryThresholdLabel()}, and orders typically arrive within ${deliveryWindow()}.`,
  },
  {
    question: "Is the packaging discreet?",
    answer:
      "Yes. Every order is shipped in plain, unbranded packaging so your purchase stays completely private.",
  },
  {
    question: "Can I exchange an item if the size is wrong?",
    answer:
      `Yes. You can exchange an item for a different size within ${POLICY.exchangeWindowDays} days of delivery, as long as it is unworn with the tags intact. Intimate apparel may be excluded for hygiene reasons — email us and we will confirm before you send anything back.`,
  },
  {
    question: "How do I choose the right size?",
    answer:
      "Each product page lists the available sizes. If you are between sizes or unsure, message us and our team will help you pick the best fit.",
  },
  {
    question: "Are the products true to size?",
    answer:
      "Fit varies by style and fabric, so check the size options and description on each product page. If you are between sizes or unsure, email us with your usual size and we will suggest a fit.",
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
      answer: `We deliver ${lower} nationwide across Pakistan, usually within ${deliveryWindow()}. Delivery is free on orders over ${freeDeliveryThresholdLabel()}.`,
    },
    {
      question: `Can I exchange ${n} if the size doesn't fit?`,
      answer: `Yes. If your ${lower} doesn't fit, you can exchange it for a different size within ${POLICY.exchangeWindowDays} days, as long as it is unworn with tags intact.`,
    },
    {
      question: `Is the packaging discreet?`,
      answer: `Absolutely. Every ${lower} order is shipped in plain, discreet packaging to keep your purchase private.`,
    },
  ]
}
