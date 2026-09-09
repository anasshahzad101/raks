import blogData from "../content/blog.json"
import pagesData from "../content/pages.json"

export type BlogPost = {
  slug: string
  title: string
  url: string
  date: string
  modified: string
  excerpt: string
  seo_title: string
  seo_desc: string
  thumbnail: string | null
  categories: string[]
  content: string
  /** Optional Q&A pairs → emitted as FAQPage schema (must match visible FAQ). */
  faqs?: { question: string; answer: string }[]
}

export type StaticPage = {
  slug: string
  title: string
  url: string
  seo_title: string
  seo_desc: string
  content: string
}

const posts = blogData as BlogPost[]
const pages = pagesData as Record<string, StaticPage>

export const getAllPosts = (): BlogPost[] => posts

export const getPostSlugs = (): string[] => posts.map((p) => p.slug)

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  posts.find((p) => p.slug === slug)

export const getRecentPosts = (n = 3): BlogPost[] => posts.slice(0, n)

export const getPageSlugs = (): string[] => Object.keys(pages)

export const getPageBySlug = (slug: string): StaticPage | undefined =>
  pages[slug]

/** Any slug that the root catch-all should resolve (blog post or static page). */
export const isContentSlug = (slug: string): boolean =>
  !!getPostBySlug(slug) || !!getPageBySlug(slug)

/**
 * Migrated WordPress dates are stored as "2026-07-03 10:00:00" — a space where
 * ISO 8601 wants a T. Schema.org date properties require ISO 8601, so every
 * `datePublished` and `dateModified` was previously being emitted in a format
 * consumers are not obliged to parse.
 */
export const toIsoDate = (raw?: string | null): string | undefined => {
  if (!raw) return undefined
  const s = String(raw).trim()
  if (!s) return undefined
  // Only the separator is corrected. Parsing through `Date` and calling
  // `toISOString()` would reinterpret these naive timestamps as the build
  // machine's local time and convert to UTC, shifting a 10:00 publish time by
  // several hours and, for late-evening posts, onto the previous or next day.
  // The source has no timezone, so none is invented: this stays a local time.
  const iso = s.replace(" ", "T")
  return isNaN(new Date(iso).getTime()) ? undefined : iso
}

export const formatDate = (iso: string): string => {
  if (!iso) return ""
  const d = new Date(iso.replace(" ", "T"))
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
