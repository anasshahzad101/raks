/**
 * Hand-written category copy for pages the WooCommerce migration left empty.
 *
 * Three categories carry products but no description at all, and two more have
 * a description with no FAQ block, so they fall through to the templated
 * shipping-and-sizing Q&As that are near-identical across every page. Search
 * Console shows what that costs: /product-category/lingerie/bras/bridal-bra-sets/
 * ranks at average position 3.78 and takes zero clicks, and
 * /product-category/lingerie/pyjama/ — 23 products — drew four impressions in
 * 28 days.
 *
 * This is a code-level override rather than a catalogue edit because the
 * storefront currently runs from a static snapshot with no Medusa admin behind
 * it. When a backend returns and these descriptions are filled in properly, the
 * catalogue value wins automatically: the template only reaches for this when
 * the category itself has nothing.
 */
import type { Faq } from "./faqs"

export type CategoryCopy = {
  /** Long-form "About the collection" body. Plain paragraphs, rendered as HTML. */
  description?: string
  /** Replaces the templated FAQs, which carry no topical information. */
  faqs?: Faq[]
}

export const categoryCopy: Record<string, CategoryCopy> = {
  "push-up-bra": {
    description: `
<p>A push-up bra lifts and centres the bust using angled padding that sits along the outer and lower edge of the cup, rather than the even padding of a standard t-shirt bra. The effect is a fuller shape and more visible cleavage, which is why it is the style most often bought for fitted outfits, party wear and bridal shoots.</p>
<p>There are two things worth knowing before you choose one. First, padding level: light push-up adds shape without changing your size noticeably, while double push-up is designed to add a visible cup size and works best under structured clothing. Second, wiring: almost all push-up bras are underwired, because the wire is what holds the lift in place. A push-up bra that fits correctly should not dig in — if the wire sits on breast tissue rather than the ribcage, the band is too small.</p>
<p>Push-up bras suit smaller busts particularly well, because the padding does the shaping work. On a fuller bust, a lightly padded or balconette style usually gives a better silhouette than a heavy push-up, which can look over-projected. If you are unsure, our padded bra range sits between the two.</p>
<p>Every push-up bra at Raks is available with Cash on Delivery across Pakistan, ships in plain unbranded packaging, and can be exchanged for a different size if the fit is not right.</p>
`.trim(),
    faqs: [
      {
        question: "Does a push-up bra make you look bigger?",
        answer:
          "Yes — that is what it is designed to do. Angled padding along the lower and outer edge of the cup lifts the bust and pushes it inward, which creates a fuller shape and more cleavage. A light push-up adds shape subtly; a double push-up is designed to add a visible cup size.",
      },
      {
        question: "What is the difference between a push-up bra and a padded bra?",
        answer:
          "A padded bra has even padding throughout the cup — it smooths the shape and hides show-through, but does not change your silhouette much. A push-up bra concentrates the padding at the bottom and outer edge specifically to lift and centre the bust.",
      },
      {
        question: "Are push-up bras good for a small bust?",
        answer:
          "They are one of the best options, because the padding does the shaping rather than relying on existing volume. On a fuller bust a balconette or lightly padded style usually looks more natural than a heavy push-up.",
      },
      {
        question: "Are push-up bras comfortable to wear all day?",
        answer:
          "A correctly fitted one is, but they are more structured than everyday bras. If you want push-up shape for long days, choose a lighter padding level. If the wire is sitting on breast tissue instead of your ribcage, the band size is too small — that is the usual cause of discomfort, not the style itself.",
      },
      {
        question: "How much does a push-up bra cost in Pakistan?",
        answer:
          "Current prices for every push-up bra in stock are shown in the grid above. Cash on Delivery is available nationwide and delivery is free on orders over Rs 3,000.",
      },
    ],
  },

  "bridal-bra-sets": {
    description: `
<p>A bridal bra set is a matching bra and panty — sometimes with a garter belt, stockings or a robe — bought as one piece for a wedding trousseau. Buying a set rather than separates is the usual choice in Pakistan for a simple reason: the pieces are designed together, so the lace, colour and finish match exactly, which is difficult to achieve buying items individually.</p>
<p>Most bridal sets are built around an underwired, lightly padded or push-up bra, because that is what works under a fitted bridal outfit. The detailing — lace overlay, embroidery, satin trim — is on the outside of the cup where it will not show through, and the panty is cut to match. Ivory, blush, deep red and black are the colours most often requested.</p>
<p>Fit matters more here than for everyday lingerie, because a bridal set is usually worn for a long day under structured clothing. Order early enough to exchange for a different size if needed, and if you are between sizes, choose based on the band rather than the cup — the band does most of the support work.</p>
<p>Every bridal set ships in plain, unbranded packaging with Cash on Delivery available across Pakistan.</p>
`.trim(),
    faqs: [
      {
        question: "What is included in a bridal bra set?",
        answer:
          "At minimum a matching bra and panty. Larger sets add a garter belt, stockings or a short robe. Exactly what is included is listed on each product page, since it varies between designs.",
      },
      {
        question: "Why buy a bridal set instead of separate pieces?",
        answer:
          "The pieces are designed together, so the lace, colour and finish match exactly. Matching separates bought individually is difficult, because dye lots and lace patterns differ between products.",
      },
      {
        question: "What kind of bra comes in a bridal set?",
        answer:
          "Usually underwired and lightly padded or push-up, because that is what holds its shape under a fitted bridal outfit through a long day. The decorative detail sits on the outside of the cup so it does not show through.",
      },
      {
        question: "Which colours work best for a bridal set?",
        answer:
          "Ivory, blush, deep red and black are the most requested in Pakistan. Ivory and blush disappear under most bridal fabrics; red and black are chosen when the set is meant to be seen.",
      },
      {
        question: "How far in advance should I order?",
        answer:
          "Early enough to exchange if the fit is wrong. Delivery is typically 3–5 business days nationwide, so ordering two to three weeks before the event leaves room for one exchange.",
      },
    ],
  },

  "sexy-night-dresses": {
    description: `
<p>This range covers the more daring end of our nightwear — sheer lace, mesh panels, deep necklines, open backs and short cuts, in satin and silk-feel fabrics that drape rather than cling. These are the pieces bought for a specific evening rather than everyday sleep: wedding nights, honeymoons and anniversaries.</p>
<p>The single biggest factor in whether one of these gets worn more than once is fabric. Stiff, scratchy lace photographs well and is uncomfortable within an hour. Soft stretch lace, brushed mesh and silk-feel satin stay wearable, which is what we stock. The second factor is cut: a piece that skims the body is more flattering than one pulled tight, so if you are between sizes in this range, take the larger one.</p>
<p>Lengths run from short babydolls and slips through to long backless gowns. Short styles suit warm nights and are the more common choice in Pakistan; longer pieces are usually chosen for bridal use, where they are often bought as part of a multi-piece set with a matching robe.</p>
<p>Every order ships in plain, unbranded packaging with nothing on the outside identifying the contents or the sender, and Cash on Delivery means there is no card statement either.</p>
`.trim(),
    faqs: [
      {
        question: "Is the packaging discreet?",
        answer:
          "Yes. Orders ship in plain, unbranded packaging with no indication of the contents or the sender, and Cash on Delivery means nothing appears on a card statement.",
      },
      {
        question: "Which fabric should I choose?",
        answer:
          "Soft stretch lace, brushed mesh and silk-feel satin. These stay comfortable through a warm night. Stiff lace looks striking but is rarely worn twice.",
      },
      {
        question: "Should I size up or down?",
        answer:
          "Size up if you are between sizes. These styles are cut to drape over the body, and that is what makes them flattering — pulled tight, they lose the effect.",
      },
      {
        question: "Short or long?",
        answer:
          "Short babydolls and slips are the more common choice in Pakistan and suit warm nights. Longer backless gowns are usually chosen for bridal use, often as part of a set with a matching robe.",
      },
      {
        question: "Can I exchange it if the fit is wrong?",
        answer:
          "Yes, as long as the item is unworn with the tags intact. You can exchange for a different size or return it for a refund.",
      },
    ],
  },

  // Has a description already; only the FAQ block is missing, so the templated
  // shipping Q&As were showing on a 23-product category.
  pyjama: {
    faqs: [
      {
        question: "What is the difference between a pyjama set and a nighty?",
        answer:
          "A pyjama set is two pieces — a top with trousers or shorts. A nighty is a single dress. Pyjamas are the more practical choice if you share space or want something you can answer the door in.",
      },
      {
        question: "Which pyjama fabric is best for Pakistan's summer?",
        answer:
          "Cotton and cotton blends. Both breathe and stay cool through a warm night. Silk and satin pyjamas feel cooler to the touch initially but trap more heat over a full night, so they suit air-conditioned rooms and winter better.",
      },
      {
        question: "Do pyjama sets come in full-length and shorts?",
        answer:
          "Both. Full-length trouser sets are the year-round staple; short sets and cami-and-shorts combinations are the summer choice. The length is described on every product page.",
      },
      {
        question: "How should I size a pyjama set?",
        answer:
          "Size on your usual measurements — pyjamas are cut loose by design. If the top and trousers are offered in separate sizes, that is shown on the product page.",
      },
      {
        question: "How much does a pyjama set cost in Pakistan?",
        answer:
          "Prices vary with fabric — cotton sets cost less than silk or satin. Current prices for everything in stock are shown in the grid above, and delivery is free on orders over Rs 3,000.",
      },
    ],
  },

  "nighty-dress-for-girls": {
    faqs: [
      {
        question: "What styles suit younger women best?",
        answer:
          "Simple cotton and jersey nighties, short sets and cami-and-shorts combinations. They are comfortable, easy to wash and practical for everyday use, which is what this range focuses on.",
      },
      {
        question: "Which fabric is best for everyday wear?",
        answer:
          "Cotton and jersey. Both breathe well through a warm night and survive frequent washing far better than satin, which needs gentler care.",
      },
      {
        question: "Are these true to size?",
        answer:
          "Yes. Order your usual size — these styles are cut loose rather than fitted. Available sizes are listed on every product page.",
      },
      {
        question: "Is Cash on Delivery available?",
        answer:
          "Yes, anywhere in Pakistan. You pay when the order reaches your door, and delivery is free on orders over Rs 3,000.",
      },
      {
        question: "How should I wash them?",
        answer:
          "Cotton and jersey pieces machine-wash normally. Anything with satin or lace detail should go on a delicate cycle inside a mesh bag and be dried in shade.",
      },
    ],
  },
}

export const getCategoryCopy = (handle?: string | null): CategoryCopy | undefined =>
  handle ? categoryCopy[handle] : undefined
