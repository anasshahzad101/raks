import { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getPostBySlug,
  getPageBySlug,
  getPostSlugs,
  getPageSlugs,
  formatDate,
} from "@lib/blog"
import { BRAND, absoluteUrl, postUrl } from "@lib/raks"
import { getRelatedCollections } from "@lib/landing-pages"
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
    const articleLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      image: post.thumbnail ? [absoluteUrl(post.thumbnail)] : [],
      datePublished: post.date,
      dateModified: post.modified || post.date,
      author: { "@type": "Organization", name: BRAND.name },
      publisher: {
        "@type": "Organization",
        name: BRAND.name,
        logo: { "@type": "ImageObject", url: absoluteUrl(BRAND.logo) },
      },
      mainEntityOfPage: absoluteUrl(postUrl(slug)),
      description: post.seo_desc || post.excerpt,
    }

    const faqLd = post.faqs?.length
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
            <p className="mt-5 text-sm text-ink/55">{formatDate(post.date)}</p>
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
          collections={getRelatedCollections(
            `${post.title} ${post.slug} ${post.categories.join(" ")}`
          )}
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
