import { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getPostBySlug,
  getPageBySlug,
  getPostSlugs,
  getPageSlugs,
  formatDate,
  toIsoDate,
} from "@lib/blog"
import { BRAND, absoluteUrl, postUrl, ORG_ID } from "@lib/raks"
import { getRelatedCollections } from "@lib/landing-pages"
import { listCategories, categoryPath } from "@lib/data/categories"
import { relatedCategoryHandles } from "@lib/util/related-categories"
import { categoryH1 } from "@lib/util/category-seo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArticleBody from "@modules/blog/components/article-body"
import BlogCollectionsCta from "@modules/blog/components/collections-cta"

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return [...getPostSlugs(), ...getPageSlugs()].map((slug) => ({ slug }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const post = getPostBySlug(slug)
  const page = getPageBySlug(slug)
  const item = post || page
  if (!item) return {}

  const title = item.seo_title || item.title
  const description =
    item.seo_desc ||
    (post?.excerpt ?? "").slice(0, 160) ||
    `${item.title} — ${BRAND.name}`
  const canonical = absoluteUrl(postUrl(slug))
  const image = post?.thumbnail ? absoluteUrl(post.thumbnail) : undefined

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: post ? "article" : "website",
      title,
      description,
      url: canonical,
      siteName: BRAND.name,
      images: image ? [{ url: image }] : [],
    },
  }
}

export default async function ContentPage(props: Props) {
  const { slug } = await props.params
  const post = getPostBySlug(slug)
  const page = getPageBySlug(slug)

  if (!post && !page) {
    notFound()
  }

  // ---- Blog post ----
  if (post) {
    const topics = `${post.title} ${post.slug} ${post.categories.join(" ")}`

    // Resolved against the live tree so a renamed category drops out of the CTA
    // instead of shipping a dead internal link.
    const categoryTree = await listCategories()
    const byHandle = new Map(categoryTree.map((c) => [c.handle, c]))
    const relatedCategories = relatedCategoryHandles(topics)
      .map((handle) => byHandle.get(handle))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ name: categoryH1(c), href: categoryPath(c) }))

    const articleLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      image: post.thumbnail ? [absoluteUrl(post.thumbnail)] : [],
      datePublished: toIsoDate(post.date),
      dateModified: toIsoDate(post.modified || post.date),
      // Reference the single Organization node from the root layout rather than
      // restating it. This page used to emit three separate Organization objects
      // (root layout, author, publisher), which asks consumers to reconcile three
      // descriptions of one business.
      // The author should become a named Person once the owner confirms who
      // writes the Journal (OWNER-10) — Google prefers a person here.
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      mainEntityOfPage: absoluteUrl(postUrl(slug)),
      description: post.seo_desc || post.excerpt,
    }

    // 16 of the migrated posts carry their own <script type="application/ld+json">
    // FAQPage block inside their HTML body. Emitting a second one from the
    // `faqs` field would describe the same page with two competing FAQ sets;
    // one post did exactly that. The embedded block wins, because it is the one
    // whose questions match the visible article text.
    const hasEmbeddedFaqLd = /<script[^>]*application\/ld\+json/i.test(
      post.content ?? ""
    )

    const faqLd = post.faqs?.length && !hasEmbeddedFaqLd
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null

    return (
      <article className="pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
        />
        {faqLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
          />
        )}
        <header className="bg-cream-100">
          <div className="content-container max-w-3xl py-12 lg:py-16 text-center">
            <nav className="text-xs uppercase tracking-wider text-bronze-600 mb-5">
              <LocalizedClientLink href="/" className="hover:underline">Home</LocalizedClientLink>
              <span className="mx-2">/</span>
              <LocalizedClientLink href="/blogs/" className="hover:underline">Journal</LocalizedClientLink>
            </nav>
            <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight">
              {post.title}
            </h1>
            {/* A visible last-updated date. Answer engines weight recency for
                commercial and evaluation queries, and a reader deciding whether
                to trust a price guide wants to know when it was last checked.
                Only shown when the post genuinely changed after publication. */}
            <p className="mt-5 text-sm text-ink/55">
              {formatDate(post.date)}
              {post.modified && post.modified !== post.date && (
                <> · Last updated {formatDate(post.modified)}</>
              )}
            </p>
          </div>
        </header>

        {post.thumbnail && (
          <div className="content-container max-w-4xl -mt-2">
            <div className="aspect-[16/9] overflow-hidden rounded-large bg-bronze-100 mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <ArticleBody html={post.content} />

        <BlogCollectionsCta
          categories={relatedCategories}
          collections={getRelatedCollections(topics)}
        />

        <div className="content-container max-w-3xl mt-12 text-center">
          <LocalizedClientLink
            href="/blogs/"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-bronze-600 hover:text-ink transition-colors"
          >
            ← Back to Journal
          </LocalizedClientLink>
        </div>
      </article>
    )
  }

  // ---- Static page (about, contact, privacy, terms) ----
  return (
    <div className="pb-20">
      <header className="bg-cream-100">
        <div className="content-container max-w-3xl py-12 lg:py-16 text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight">
            {page!.title}
          </h1>
        </div>
      </header>
      <ArticleBody html={page!.content} />
    </div>
  )
}
