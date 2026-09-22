/**
 * Ad landing pages ("campaign pages").
 *
 * One page per paid campaign, served at /offer/{slug}/ inside the (campaign)
 * route group: no navigation, no search, no assistant, one product and one
 * button. A shopper arriving from an ad has already been sold the product by
 * the ad; the page's job is to remove every reason not to order it.
 *
 * Copy lives here, not in the page, so a new campaign is one entry in this
 * array. Prices are never written here — the page reads them from Medusa at
 * build time — except `regularPrice`, which is the struck-through anchor the
 * owner has stated and is used only while Medusa has not yet applied the sale
 * price list (see apps/backend/src/scripts/apply-sale-prices.ts).
 *
 * Every promise below has to be one checkout actually keeps: cash on delivery,
 * the delivery window, the exchange window and the packaging all come from
 * POLICY, and this file is checked by scripts/check-claims.mjs.
 */

import type { Faq } from "./faqs"
import { POLICY, deliveryWindow, freeDeliveryThresholdLabel } from "./raks"

export type CampaignPhoto = {
  /** Site-relative path under /public. */
  src: string
  /** What the photo actually shows — read out to screen readers, so no sales copy. */
  alt: string
  /** "contain" for a square flat-lay that must not be cropped; default "cover". */
  fit?: "cover" | "contain"
}

export type CampaignColour = {
  /** The Medusa option value, matched case-insensitively. */
  value: string
  /** What the page calls it. */
  label: string
  /** One line under the swatch. */
  note: string
  /**
   * The swatch photo for this colour, site-relative. The migrated catalogue
   * keeps one image per colour on the product, not on the variants, so
   * Medusa cannot say which picture belongs to "Blue"; this can.
   */
  image?: string
  /**
   * The gallery, first photo first. Falls back to `image` alone. Owner-supplied
   * photos live under /public/media/campaign/{slug}/ so they ship with the
   * storefront and need no Medusa upload.
   */
  photos?: CampaignPhoto[]
}

export type CampaignPage = {
  slug: string
  /** Medusa product handle the page sells. */
  handle: string
  /**
   * Owner-stated regular price, in rupees. Shown struck through only when
   * Medusa is not yet reporting a sale price for the variant.
   */
  regularPrice: number
  metaTitle: string
  metaDescription: string
  eyebrow: string
  headline: string
  subheadline: string
  ctaLabel: string
  /** Short lines under the price. Delivery cost is computed, not listed here. */
  reassurance: string[]
  pieces: { name: string; detail: string }[]
  reasons: { heading: string; body: string }[]
  /**
   * The colours this page sells. Variants in any other colour are left off
   * the page entirely, so an ad for one colour cannot sell another. With a
   * single entry the page shows no colour picker and no colour section.
   */
  colours: CampaignColour[]
  sizing: { heading: string; body: string }
  gift?: string
  steps: { heading: string; body: string }[]
  faqs: Faq[]
}

export const campaignPages: CampaignPage[] = [
  {
    slug: "bridal-silk-nightgown-set",
    handle: "bridal-silk-5pcs-nightgown-set",
    regularPrice: 4999,
    metaTitle: "Bridal Silk 5-Piece Nightgown Set — Sale | Raks",
    metaDescription:
      "Robe, long nightgown, cami top, shorts and trousers in one bridal silk set. Cash on delivery across Pakistan, plain packaging, easy size exchange.",
    eyebrow: "Bridal nightwear · 5-piece set",
    headline: "Your complete bridal nightwear set. Five silk pieces, one price.",
    subheadline:
      "A wrap robe, a long nightgown, a cami top, shorts and trousers in matching silk with lace trim. Wear them together on the wedding night, then mix them for months after.",
    ctaLabel: "Order now · Cash on Delivery",
    reassurance: [
      "Pay cash when the parcel arrives. Nothing to pay now.",
      "Plain, unbranded packaging. Nobody can tell what is inside.",
      `Wrong size? Exchange it within ${POLICY.exchangeWindowDays} days of delivery.`,
    ],
    pieces: [
      {
        name: "Wrap robe",
        detail:
          "Ties at the waist, with lace on the sleeves. The piece that makes the set feel bridal.",
      },
      {
        name: "Long nightgown",
        detail: "Slip style with a lace neckline and adjustable straps.",
      },
      {
        name: "Cami top",
        detail:
          "Short slip top with the same lace neckline. Wear it with the shorts or the trousers.",
      },
      {
        name: "Shorts",
        detail: "Loose silk shorts with lace at the hem, for warm nights.",
      },
      {
        name: "Trousers",
        detail:
          "Full-length silk trousers with lace at the ankle, for cooler ones.",
      },
    ],
    reasons: [
      {
        heading: "One set, many nights",
        body: "Robe over the nightgown for the wedding night. Cami and shorts in summer. Cami and trousers in winter. You are not buying one outfit, you are buying a small wardrobe.",
      },
      {
        heading: "Silk that is easy to live with",
        body: "Soft and breathable, so it feels cool in summer and warm in winter. Hand wash in cold water and it keeps its shine.",
      },
      {
        heading: "Room to fit",
        body: "The nightgown and the cami have adjustable straps. Choose Medium or Large, and if it is not right, exchange it.",
      },
      {
        heading: "Delivered quietly",
        body: `Every order leaves in plain packaging with no branding, and you pay the rider in cash. Delivery takes ${deliveryWindow()} anywhere in Pakistan.`,
      },
    ],
    // Maroon only, by the owner's decision on 22 September 2026. The product
    // also comes in blue and black and stays on sale in all three on the
    // product page; the ad, and so this page, sells the maroon set.
    colours: [
      {
        value: "Maroon",
        label: "Maroon",
        note: "The classic bridal red.",
        image: "/media/uploads/2025/02/red-bridal-nightwear.jpg",
        // Photos supplied by the owner on 22 September 2026. The collage is
        // the featured image by the owner's choice: it is the one picture
        // that shows the pieces worn in their combinations. The flat-lay
        // stays last so all five pieces are seen laid out, not just claimed.
        photos: [
          {
            src: "/media/campaign/bridal-silk-maroon/set-collage.webp",
            alt: "Collage of the maroon set worn: the robe tied over the set, the cami top with the shorts, the cami top with the trousers, the robe from behind, and close-ups of the lace",
            fit: "contain",
          },
          {
            src: "/media/campaign/bridal-silk-maroon/front.jpg",
            alt: "The maroon set worn with the robe tied over the cami top and trousers, seen from the front",
          },
          {
            src: "/media/campaign/bridal-silk-maroon/lace-detail.jpg",
            alt: "Close-up of the lace neckline on the cami top and the lace cuff of the robe",
          },
          {
            src: "/media/campaign/bridal-silk-maroon/three-quarter.jpg",
            alt: "The robe, cami top and trousers from the front at an angle, showing the lace on the robe",
          },
          {
            src: "/media/campaign/bridal-silk-maroon/side.jpg",
            alt: "Side view of the robe and trousers, showing the belt and the lace at the ankle",
          },
          {
            src: "/media/campaign/bridal-silk-maroon/back.jpg",
            alt: "Back view of the robe and trousers",
          },
          {
            src: "/media/campaign/bridal-silk-maroon/bedroom.jpg",
            alt: "The maroon set worn in a bedroom, robe tied at the waist",
          },
          {
            src: "/media/uploads/2025/02/red-bridal-nightwear.jpg",
            alt: "All five pieces laid out: robe, long nightgown, cami top, shorts and trousers",
            fit: "contain",
          },
        ],
      },
    ],
    sizing: {
      heading: "Medium or Large",
      body: "Both sizes come with adjustable straps on the nightgown and the cami, so there is give either way. Not sure which to pick? Message us on WhatsApp with your usual size and we will help.",
    },
    gift: "Buying it for the bride? Put her name, number and address at checkout and we deliver straight to her.",
    steps: [
      {
        heading: "Choose your size",
        body: "Medium or Large. The set comes in bridal maroon.",
      },
      {
        heading: "Enter your details",
        body: "Name, phone number and delivery address. No account, no card.",
      },
      {
        heading: "Pay at the door",
        body: `Cash on delivery, ${deliveryWindow()} after you order.`,
      },
    ],
    faqs: [
      {
        question: "What is the fabric like?",
        answer:
          "Soft, smooth silk with a light sheen. It is breathable, so it is comfortable in summer as well as winter.",
      },
      {
        question: "Which sizes are available?",
        answer:
          "Medium and Large. The nightgown and the cami top have adjustable straps.",
      },
      {
        question: "Do I have to pay in advance?",
        answer:
          "No. Every order is cash on delivery. You pay the rider when the parcel reaches you.",
      },
      {
        question: "How long does delivery take, and what does it cost?",
        answer: `Orders arrive within ${deliveryWindow()} anywhere in Pakistan. Delivery is free on orders over ${freeDeliveryThresholdLabel()}.`,
      },
      {
        question: "Is the packaging discreet?",
        answer: "Yes. Every order is shipped in plain, unbranded packaging.",
      },
      {
        question: "What if the size is wrong?",
        answer: `You can exchange it for the other size within ${POLICY.exchangeWindowDays} days of delivery, as long as it is unworn with the tags intact. Message us on WhatsApp and we will arrange it.`,
      },
      {
        question: "Can I wear it after the wedding?",
        answer:
          "Yes. It is made for honeymoons, anniversaries and ordinary nights too. The pieces work on their own as well as together.",
      },
      {
        question: "How do I wash it?",
        answer:
          "Hand wash in cold water with a mild detergent and air dry. Keep it out of the machine and the dryer.",
      },
    ],
  },
]

export function getCampaignPage(slug: string): CampaignPage | undefined {
  return campaignPages.find((p) => p.slug === slug)
}
