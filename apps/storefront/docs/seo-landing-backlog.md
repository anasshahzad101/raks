# SEO Landing-Page Backlog

How to keep growing long-tail "collection" landing pages for ranking exposure.
This is the **single biggest SEO lever** for the catalogue (competitors run
146–385 indexable pages vs our ~50).

## How to add a landing page (5 min)

1. Append an entry to `src/lib/landing-pages.ts` (`landingPages` array):
   ```ts
   {
     slug: "printed-pyjama",
     heading: "Printed Pyjama",
     query: "printed",            // store keyword search (q=)
     categoryHandle: "pyjama",    // optional — scopes the search to a category
     title: "Buy Printed Pyjama Sets Online in Pakistan | Raks",
     description: "...155-char fact-packed meta...",
     intro: "...50–80 word unique intro paragraph...",
   }
   ```
2. That's it — it **auto-flows** to:
   - the route `/collections/{slug}/`
   - `sitemap.ts`
   - the footer "Shop by Style" column (first 9) + `/collections` hub (all)
   Each page automatically gets a geo title, FAQ accordion + FAQPage schema,
   and a BreadcrumbList.

**Rule:** before adding, confirm the keyword returns enough products
(`/store/products?q=KEYWORD&region_id=...` — aim for ≥6). Use `categoryHandle`
to keep results precise (e.g. "cotton" alone mixes bras + nighties).
**Don't duplicate existing categories** — bra TYPES (t-shirt, push-up, sports,
padded, minimizer, etc.) and nightwear occasions already exist under
`/product-category/`.

## Ready to add now (verified inventory)
| slug | query | scope | ~count |
|---|---|---|---|
| satin-pyjama | satin | pyjama | 6 |
| cotton-pyjama | cotton | pyjama | 4 (thin) |
| waist-shaper | waist | shapewear | ~ (scope to shapewear) |

## Bigger plays (need a little infra)
- **Bra-size landing pages (highest value, programmatic):** `/collections/32b-bra/`,
  `34c-bra/`, … like all 3 competitors. Needs **variant-level filtering** (bra
  sizes are variant options, not searchable via `q`). Build by querying products
  that have a given band+cup variant, then reuse the landing template. Could add
  30–50 pages.
- **Color landing pages:** black / red / skin / pink nighty & bra. Needs color
  option/tag filtering (no color tags currently exposed — may need to add tags
  in Medusa admin or infer from titles).
- **Price-intent pages:** "nighty under Rs 1,000", "bras under Rs 1,500" — filter
  by price ceiling.

## Revisit when inventory grows (currently too thin, <5)
net-bra (3), seamless-bra (3), lace-panty (3), thong-panty in panties (3),
garter (1), stockings (1), bikini (1), maternity (1), kaftan (0), bodystocking (0).

## Live as of 2026-06-23 (26 pages)
silk/net/lace/satin/cotton/transparent-nighty, bridal-nightwear, honeymoon-nighty,
short/long/babydoll/jersey/floral/printed/embroidered-nighty, plus-size-nighty,
cami-sets, bodysuit, cotton-bra, lace-bra, silk-robe, silk-pyjama, tummy-tucker,
thong-panty, cotton-panty, slip-dress.
