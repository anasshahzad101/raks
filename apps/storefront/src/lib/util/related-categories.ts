/**
 * Maps a blog post to the category pages it should link to.
 *
 * The Journal is the strongest thing on the site in search — 117 posts holding
 * 54% of all impressions at an average position of 8.0, while the category
 * pages they exist to sell sit at 13.7. Until now every post's closing CTA
 * pointed only at /collections/ landing pages, so none of that authority
 * reached /product-category/. These rules route it there.
 *
 * Handles only; the caller resolves them against the live category tree so a
 * renamed or removed category drops out instead of 404ing.
 */

/**
 * Ordered most-specific-first. Every match contributes, so a post about
 * "fancy bra panty sets" collects the fancy-bra, bras and panties categories
 * before the limit truncates.
 *
 * Deliberately excludes bralette, fabric-based-night-dress and
 * luxury-nightwear: those categories hold no products and are noindex, so
 * linking to them would push readers and crawlers into dead ends.
 */
const CATEGORY_RULES: [RegExp, string[]][] = [
  [/nursing|maternity/, ["nursing-and-maternity-bras", "bras"]],
  [/sports.?bra/, ["sports-bra", "bras"]],
  [/t.?shirt.?bra/, ["t-shirt-bra", "bras"]],
  [/push.?up/, ["push-up-bra", "padded-bra", "bras"]],
  [/minimi[sz]er/, ["minimizer-bra", "bras"]],
  [/underwired|non.?wired|non.?padded/, ["non-padded-bra", "padded-bra", "bras"]],
  [/padded/, ["padded-bra", "bras"]],
  [/fancy|net.?bra|lace.?bra|strap/, ["fancy-bra-in-pakistan", "bras"]],
  [
    /bridal.*bra|bra.*bridal|wedding.*bra|trousseau|strapless|backless/,
    ["bridal-bra", "bridal-bra-sets", "bras"],
  ],
  [
    /first.?night|wedding.?night|bridal.*night|night.*bridal|dulhan/,
    ["bridal-night-dress", "nightwear"],
  ],
  [/nightgown|long.?night/, ["nightgowns", "nightwear"]],
  [/night.?suit|pyjama|pajama/, ["pyjama", "night-suits-for-ladies"]],
  [/hot.?night|sexy|romantic|honeymoon/, ["sexy-night-dresses", "nightwear"]],
  // Teen and first-bra content routes to bras only, never to nightwear or
  // lingerie. Verified live before this change: "Are Padded Bras Good for
  // Teenagers?" rendered a "Shop the Collection" block linking to a category
  // that contains transparent lingerie. A teen-audience article must not
  // recommend adult intimate apparel.
  [/teenager|teen|beginner|first.?bra|training.?bra/, ["non-padded-bra", "bras"]],
  // "for girls" is colloquial for young women in Pakistani English, so it stays
  // on general nightwear rather than the adult-intimate subcategories.
  [/for.?girls/, ["nightwear", "lingerie"]],
  [/shapewear|shaper|tummy/, ["shapewear"]],
  [/panty|panties|underwear|thong/, ["panties"]],
  [/nighty|nighties|nightdress|night.?dress|nightwear/, ["nightwear", "lingerie"]],
  [/\bbras?\b|bust|breast|cup.?size|sagg/, ["bras", "lingerie"]],
  [/lingerie/, ["lingerie"]],
]

/** Category handles a post should link to, most relevant first. */
export function relatedCategoryHandles(text: string, limit = 3): string[] {
  const t = text.toLowerCase()
  const handles: string[] = []

  for (const [re, mapped] of CATEGORY_RULES) {
    if (!re.test(t)) continue
    for (const h of mapped) if (!handles.includes(h)) handles.push(h)
  }

  // Every post on this site is lingerie editorial, so the top three commercial
  // categories are a safe floor rather than an arbitrary guess.
  const result = handles.length ? handles : ["bras", "nightwear", "lingerie"]
  return result.slice(0, limit)
}
