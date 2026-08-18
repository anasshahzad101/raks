import type { MetadataRoute } from "next"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { getAllPosts, getPageSlugs } from "@lib/blog"
import { landingPages } from "@lib/landing-pages"
import { SITE_URL } from "@lib/raks"
import { isIndexableCategory } from "@lib/util/category-seo"

// Generated at build time: the catalog is fetched from Medusa during `next build`
// and baked into a static sitemap.xml. This keeps the sitemap complete (products +
// categories included) even when the storefront runs without a live backend.
export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const now = new Date()

  // static
  entries.push(
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/blogs/`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/faqs/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/collections/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }
  )

  // long-tail collection landing pages
  for (const lp of landingPages) {
    entries.push({
      url: `${SITE_URL}/collections/${lp.slug}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    })
  }

  // products — also tallies products per category, so the category block below
  // can drop empty ones without a second pass over the catalog.
  const productsPerCategory = new Map<string, number>()
  try {
    const { response } = await listProducts({
      countryCode: "pk",
      queryParams: { limit: 1000, fields: "handle,updated_at,*categories" } as any,
    })
    for (const p of response.products) {
      for (const c of (p as any).categories ?? []) {
        if (c?.id) productsPerCategory.set(c.id, (productsPerCategory.get(c.id) ?? 0) + 1)
      }
      if (!p.handle) continue
      entries.push({
        url: `${SITE_URL}/product/${p.handle}/`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  } catch {}

  // categories (hierarchical path)
  try {
    const cats = await listCategories()
    const byId = new Map(cats.map((c: any) => [c.id, c]))
    for (const c of cats as any[]) {
      // Empty categories are noindex on the page itself; listing them here
      // would ask Google to crawl what it is told not to index.
      if (!isIndexableCategory(productsPerCategory.get(c.id) ?? 0)) continue
      const slugs: string[] = []
      let cur: any = c
      while (cur) {
        if (cur.handle) slugs.unshift(cur.handle)
        cur = cur.parent_category ?? (cur.parent_category_id ? byId.get(cur.parent_category_id) : null)
      }
      entries.push({
        url: `${SITE_URL}/product-category/${slugs.join("/")}/`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  } catch {}

  // blog posts
  for (const post of getAllPosts()) {
    entries.push({
      url: `${SITE_URL}${post.url}`,
      lastModified: post.modified ? new Date(post.modified.replace(" ", "T")) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    })
  }

  // static content pages
  for (const slug of getPageSlugs()) {
    entries.push({
      url: `${SITE_URL}/${slug}/`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    })
  }

  return entries
}
