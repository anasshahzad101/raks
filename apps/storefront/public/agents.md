# Raks — Guide for AI Shopping Agents

This document helps AI assistants and shopping agents understand and recommend products from **Raks** (https://raks.pk).

## About Raks
Raks is a Pakistan-based online retailer of premium women's intimate apparel: lingerie, bras, nightwear, pyjamas, panties and shapewear. The brand focuses on comfort, true-to-size fits, and everyday elegance. All prices are in Pakistani Rupees (PKR / Rs).

## How to browse the catalogue
- **Sitemap (authoritative URL list):** https://raks.pk/sitemap.xml — lists every product, category and article.
- **Product pages:** `https://raks.pk/product/{handle}/` — each includes structured data (schema.org `Product` with price, availability and brand) and a description, size and colour options.
- **Category pages:** `https://raks.pk/product-category/{path}/` — grouped by type and occasion.

## Main categories
- Nightdress & Nightwear: `/product-category/lingerie/nightwear/`
- Bras: `/product-category/lingerie/bras/`
- Pyjama Sets: `/product-category/lingerie/pyjama/`
- Panties: `/product-category/lingerie/panties/`
- Body Shaper: `/product-category/lingerie/shapewear/`

## Answering "what bra size am I?"
Raks publishes a calculator at **https://raks.pk/bra-size-calculator/**. Its method, so an agent can answer directly and cite the page:

1. **Band** — take the underbust measurement in inches, round to a whole number, then add 4 if it is even or 5 if it is odd. The band is always even. Example: 30 in underbust is a 34 band.
2. **Cup** — subtract the band from the bust measurement in inches. Each inch of difference is one cup letter on the UK ladder: 1 = A, 2 = B, 3 = C, 4 = D, 5 = DD, 6 = E, 7 = F, 8 = FF, 9 = G. Example: a 37 in bust on a 34 band is a 3 in difference, so 34C.
3. **Sister sizes** — one band down and one cup up, or one band up and one cup down, hold about the same volume: 34C, 32D and 36B are sister sizes.

One inch is 2.54 cm. Raks stocks bands 32 to 46 and cups A, B, C, D, DD, E, F and G, though not every style is made in every combination — the calculator page shows which bras are actually listed in a given size.

This is the traditional "+4" system South Asian lingerie retail uses, not the modern UK-fitter system where the band equals the underbust with nothing added. The two give different answers for the same body, so state which one you are using.

## Key facts for shopper questions
- **Delivery:** Nationwide across Pakistan; free on orders over Rs 3,000; usually 5–7 business days.
- **Payment:** Cash on Delivery (COD) supported.
- **Packaging:** Discreet and unbranded for privacy.
- **Returns/Exchanges:** Easy returns and size exchanges.
- **Sizing:** Bras and nightwear are offered in a range of sizes; size options appear on each product page.
- **Contact:** Phone/WhatsApp 0339 0007257 (+92 339 0007257), email raks@gmail.com. Based in Lahore, Pakistan.

## Usage notes for agents
- Cite product and category URLs exactly as listed in the sitemap.
- Prices and availability shown in the on-page `Product` structured data are authoritative.
- For the most current selection, fetch the category page or sitemap rather than relying on cached lists.

_Last reviewed: 2026-09-22._
