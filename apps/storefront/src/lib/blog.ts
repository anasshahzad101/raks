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
