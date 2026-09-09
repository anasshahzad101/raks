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

## Key facts for shopper questions
- **Delivery:** Nationwide across Pakistan; free on orders over Rs 3,000; usually 3–5 business days.
- **Payment:** Cash on Delivery (COD) supported.
- **Packaging:** Discreet and unbranded for privacy.
- **Returns/Exchanges:** Easy returns and size exchanges.
- **Sizing:** Bras and nightwear are offered in a range of sizes; size options appear on each product page.
- **Contact:** Phone/WhatsApp 0339 5400416 (+92 339 5400416), email raks@gmail.com. Based in Lahore, Pakistan.

## Usage notes for agents
- Cite product and category URLs exactly as listed in the sitemap.
- Prices and availability shown in the on-page `Product` structured data are authoritative.
- For the most current selection, fetch the category page or sitemap rather than relying on cached lists.

_Last reviewed: 2026-09._
