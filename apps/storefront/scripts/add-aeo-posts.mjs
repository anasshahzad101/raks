// One-off: prepend AEO buying-guide posts to src/content/blog.json (idempotent).
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const file = join(__dirname, "..", "src", "content", "blog.json")
const posts = JSON.parse(readFileSync(file, "utf8"))

const DATE = "2026-06-23 10:00:00"

const newPosts = [
  {
    slug: "silk-vs-cotton-nighty",
    title: "Silk vs Cotton Nighty: Which Is Better for You?",
    url: "/silk-vs-cotton-nighty/",
    date: DATE,
    modified: DATE,
    excerpt:
      "Silk or cotton nighty? Compare comfort, breathability, care and price to choose the best nightwear fabric for Pakistan's climate.",
    seo_title: "Silk vs Cotton Nighty: Which Should You Buy? | Raks",
    seo_desc:
      "Silk or cotton nighty? Compare comfort, breathability, care and price to pick the best nightwear fabric for Pakistan's climate.",
    thumbnail: "/media/blog/silk-vs-cotton-nighty.jpg",
    categories: ["blogs", "buying-guides", "lingerie-types-uses"],
    content: `
<p>Choosing between a <strong>silk nighty</strong> and a <strong>cotton nighty</strong> comes down to how you want to feel at night — luxuriously smooth, or soft and breathable. Both are excellent choices; the right one depends on the season, the occasion and your skin. Here's a simple comparison to help you decide.</p>
<h2>Quick answer</h2>
<p>For <strong>everyday comfort and hot, humid nights</strong>, choose cotton — it's breathable, absorbent and easy to wash. For a <strong>luxurious, romantic or special-occasion feel</strong>, choose silk — it's smooth, temperature-regulating and elegant.</p>
<h2>Silk nighty: pros and cons</h2>
<ul>
<li><strong>Feel:</strong> Smooth, cool-to-touch and drapes beautifully on the body.</li>
<li><strong>Temperature:</strong> Naturally regulates temperature — cool in summer, warm in winter.</li>
<li><strong>Best for:</strong> Bridal nights, anniversaries, gifting and anyone who loves a touch of luxury.</li>
<li><strong>Care:</strong> Needs gentle hand washing and air drying.</li>
</ul>
<p>Browse our <a href="/collections/silk-nighty/">silk nighty collection</a> and <a href="/collections/satin-nighty/">satin nighties</a> for that smooth, elegant feel.</p>
<h2>Cotton nighty: pros and cons</h2>
<ul>
<li><strong>Feel:</strong> Soft, breathable and gentle on sensitive skin.</li>
<li><strong>Temperature:</strong> Highly breathable — ideal for Pakistan's warm climate.</li>
<li><strong>Best for:</strong> Everyday wear, summer nights and all-night comfort.</li>
<li><strong>Care:</strong> Easy machine wash and very low-maintenance.</li>
</ul>
<p>Explore our <a href="/collections/cotton-nighty/">cotton nighty collection</a> for breathable, everyday styles.</p>
<h2>Which should you choose?</h2>
<p>Many women keep both: a few <strong>cotton nighties</strong> for daily comfort and a <strong>silk nighty</strong> or two for special evenings. If you can only pick one for Pakistan's summers, cotton wins on breathability; for a romantic or gifting choice, silk wins on feel.</p>
<h3>Frequently asked questions</h3>
<p><strong>Is silk or cotton better for summer in Pakistan?</strong> Cotton is more breathable and absorbent, making it the better everyday choice for hot, humid weather — though silk's natural temperature regulation also keeps you cool.</p>
<p><strong>Is silk hard to maintain?</strong> Silk needs gentle hand washing in cool water and air drying, but with basic care it lasts beautifully for years.</p>
<p><strong>Which is better for sensitive skin?</strong> Both are skin-friendly. Cotton is hypoallergenic and great for sensitive skin, while pure silk is naturally smooth and non-irritating.</p>
<p>Ready to shop? Explore all <a href="/product-category/lingerie/nightwear/">nightdresses</a>, or browse by fabric in our <a href="/collections/">Shop by Style</a> collections — with Cash on Delivery across Pakistan.</p>
`.trim(),
  },
  {
    slug: "how-to-choose-nightwear-fabric",
    title: "How to Choose the Right Nightwear Fabric in Pakistan",
    url: "/how-to-choose-nightwear-fabric/",
    date: DATE,
    modified: DATE,
    excerpt:
      "A simple guide to choosing nightwear fabric in Pakistan — silk, cotton, satin, net and jersey compared for comfort, season and occasion.",
    seo_title: "How to Choose Nightwear Fabric: Silk, Cotton, Satin & More | Raks",
    seo_desc:
      "A simple guide to choosing nightwear fabric in Pakistan — silk, cotton, satin, net and jersey compared for comfort, season and occasion.",
    thumbnail: "/media/blog/nightwear-fabric-guide.jpg",
    categories: ["blogs", "buying-guides", "lingerie-care-maintenance"],
    content: `
<p>The fabric of your nighty affects everything — how cool you stay, how it feels on your skin, and how it looks. Here's a quick guide to the most popular nightwear fabrics in Pakistan, and when to choose each.</p>
<h2>Cotton — best for everyday comfort</h2>
<p>Soft, breathable and absorbent, cotton is the go-to for daily wear and hot nights. It's gentle on sensitive skin and easy to wash. Shop <a href="/collections/cotton-nighty/">cotton nighties</a>.</p>
<h2>Silk — best for luxury and special occasions</h2>
<p>Silk is smooth, cool-to-touch and naturally temperature-regulating. It drapes elegantly and feels indulgent, making it perfect for bridal nights and gifting. Shop <a href="/collections/silk-nighty/">silk nighties</a>.</p>
<h2>Satin — best for a silky look on a budget</h2>
<p>Satin offers a silky-smooth finish and beautiful shine at a friendlier price. It's a popular choice for both everyday glamour and special evenings. Shop <a href="/collections/satin-nighty/">satin nighties</a>.</p>
<h2>Net &amp; lace — best for romantic styles</h2>
<p>Sheer net and delicate lace create flirty, romantic looks. They're lightweight and breathable, often used in babydolls and bridal nightwear. Shop <a href="/collections/net-nighty/">net nighties</a> and <a href="/collections/lace-nighty/">lace nighties</a>.</p>
<h2>Jersey — best for stretch and softness</h2>
<p>Soft, stretchy jersey moves with you and stays comfortable all night — ideal for relaxed, everyday nightwear. Shop <a href="/collections/jersey-nighty/">jersey nighties</a>.</p>
<h3>How to choose</h3>
<ul>
<li><strong>For summer:</strong> cotton or jersey for breathability.</li>
<li><strong>For winter:</strong> silk or satin for warmth and a smooth feel.</li>
<li><strong>For bridal/special nights:</strong> silk, lace or net.</li>
<li><strong>For sensitive skin:</strong> cotton or pure silk.</li>
</ul>
<h3>Frequently asked questions</h3>
<p><strong>Which nightwear fabric is best for hot weather?</strong> Cotton and jersey are the most breathable, making them ideal for Pakistan's warm, humid nights.</p>
<p><strong>Which fabric is best for a bridal nighty?</strong> Silk, lace and net are the most popular for bridal and honeymoon nightwear thanks to their elegant, romantic feel.</p>
<p>Browse every style in our <a href="/collections/">Shop by Style</a> collections, with Cash on Delivery across Pakistan.</p>
`.trim(),
  },
  {
    slug: "types-of-nighties-guide",
    title: "Types of Nighties: A Complete Guide for Women in Pakistan",
    url: "/types-of-nighties-guide/",
    date: DATE,
    modified: DATE,
    excerpt:
      "From babydolls and slip dresses to long gowns and cami sets — explore every type of nighty and find the right style for you.",
    seo_title: "Types of Nighties: Complete Guide for Women in Pakistan | Raks",
    seo_desc:
      "From babydolls and slip dresses to long gowns and cami sets — explore every type of nighty and find the right style for you in Pakistan.",
    thumbnail: "/media/blog/types-of-nighties.jpg",
    categories: ["blogs", "lingerie-types-uses", "buying-guides"],
    content: `
<p>"Nighty" covers a whole world of styles — from cosy everyday gowns to elegant bridal pieces. Here's a complete guide to the main types of nighties available in Pakistan, so you can find the one that matches your comfort and mood.</p>
<h2>Short nighty &amp; babydoll</h2>
<p>Short, flirty and comfortable for warm nights. Babydolls are a short style with a loose, flowing cut, often in net or lace. Shop <a href="/collections/short-nighty/">short nighties</a> and <a href="/collections/babydoll-nighty/">babydoll nighties</a>.</p>
<h2>Long nighty &amp; nightgown</h2>
<p>Full-length, graceful and modest — ideal for those who prefer more coverage. Shop <a href="/collections/long-nighty/">long nighties</a>.</p>
<h2>Slip dress</h2>
<p>A smooth, fitted slip that works as nightwear or layering. Elegant and versatile. Shop <a href="/collections/slip-dress/">slip dresses</a>.</p>
<h2>Cami sets</h2>
<p>A camisole top paired with matching shorts — lightweight and modern, perfect for lounging. Shop <a href="/collections/cami-sets/">cami sets</a>.</p>
<h2>Bridal &amp; honeymoon nightwear</h2>
<p>Special pieces designed for your first night and honeymoon, usually in silk, lace or net. Shop <a href="/collections/bridal-nightwear/">bridal nightwear</a> and <a href="/collections/honeymoon-nighty/">honeymoon nighties</a>.</p>
<h2>By fabric</h2>
<p>You'll also find nighties grouped by fabric — <a href="/collections/silk-nighty/">silk</a>, <a href="/collections/cotton-nighty/">cotton</a>, <a href="/collections/satin-nighty/">satin</a>, <a href="/collections/net-nighty/">net</a> and <a href="/collections/jersey-nighty/">jersey</a>.</p>
<h3>Frequently asked questions</h3>
<p><strong>Which type of nighty is best for everyday use?</strong> Cotton nighties, long nighties and cami sets are the most practical and comfortable for daily wear.</p>
<p><strong>Which nighty is best for a bride?</strong> Silk and lace bridal nighties and babydolls are the most popular choices for the wedding night.</p>
<p><strong>What is a babydoll nighty?</strong> A babydoll is a short, loose-fitting nighty — often sheer with lace or net detailing — usually paired with a matching panty.</p>
<p>Explore the full range in <a href="/product-category/lingerie/nightwear/">Nightdress</a> or our <a href="/collections/">Shop by Style</a> collections. Cash on Delivery across Pakistan.</p>
`.trim(),
  },
  {
    slug: "how-to-measure-bra-size-at-home",
    title: "How to Measure Your Bra Size at Home (Step by Step)",
    url: "/how-to-measure-bra-size-at-home/",
    date: DATE,
    modified: DATE,
    excerpt:
      "Learn how to measure your bra size at home with a measuring tape — band and cup size steps, a size chart, and fit tips.",
    seo_title: "How to Measure Your Bra Size at Home in Pakistan | Raks",
    seo_desc:
      "Learn how to measure your bra size at home with a measuring tape — band and cup size steps, a simple size chart, and fit tips.",
    thumbnail: "/media/blog/how-to-measure-bra-size.jpg",
    categories: ["blogs", "lingerie-size-guides", "buying-guides"],
    content: `
<p>Wearing the right bra size makes all the difference to comfort and support. The good news: you can measure your bra size at home in two minutes with just a soft measuring tape. Here's how.</p>
<h2>What you need</h2>
<p>A soft measuring tape and a non-padded bra (or no bra). Measure in front of a mirror, keeping the tape snug but not tight.</p>
<h2>Step 1: Measure your band size</h2>
<p>Wrap the tape around your ribcage, directly under your bust, keeping it level all the way around. Round to the nearest whole number in inches — this is your <strong>band size</strong> (e.g., 32, 34, 36).</p>
<h2>Step 2: Measure your bust</h2>
<p>Wrap the tape around the fullest part of your bust, keeping it level. Note this measurement in inches.</p>
<h2>Step 3: Find your cup size</h2>
<p>Subtract your band measurement from your bust measurement. The difference gives your cup size:</p>
<table>
<thead><tr><th>Difference (inches)</th><th>Cup size</th></tr></thead>
<tbody>
<tr><td>1</td><td>A</td></tr>
<tr><td>2</td><td>B</td></tr>
<tr><td>3</td><td>C</td></tr>
<tr><td>4</td><td>D</td></tr>
<tr><td>5</td><td>DD / E</td></tr>
</tbody>
</table>
<p>For example, a 34-inch band and a 37-inch bust = a 3-inch difference = a <strong>34C</strong>.</p>
<h2>Fit tips</h2>
<ul>
<li>The band should sit level and snug — most support comes from the band, not the straps.</li>
<li>Straps shouldn't dig in or slip off.</li>
<li>The centre should lie flat against your chest, and cups should fully contain the bust with no spillage or gaping.</li>
</ul>
<p>Ready to shop? Browse all <a href="/product-category/lingerie/bras/">bras</a>, or explore <a href="/collections/cotton-bra/">cotton bras</a> and <a href="/collections/lace-bra/">lace bras</a>.</p>
<h3>Frequently asked questions</h3>
<p><strong>How do I measure my bra size without a measuring tape?</strong> Use a piece of string or a phone charging cable to wrap around, mark the length, then measure it against a ruler.</p>
<p><strong>What if I'm between sizes?</strong> If your band measurement is an odd number, round down for a snugger fit or up for more comfort, and adjust the cup accordingly (sister sizing).</p>
<p><strong>How often should I re-measure?</strong> Re-measure every 6–12 months, or after any noticeable weight change, pregnancy or breastfeeding.</p>
`.trim(),
  },
]

let added = 0
for (const np of newPosts.reverse()) {
  if (posts.some((p) => p.slug === np.slug)) continue
  posts.unshift(np)
  added++
}

writeFileSync(file, JSON.stringify(posts, null, 0))
console.log(`Added ${added} posts. Total now: ${posts.length}`)
