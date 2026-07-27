import { Metadata } from "next"
import { getAllPosts, formatDate } from "@lib/blog"
import { BRAND, absoluteUrl } from "@lib/raks"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: { absolute: `Journal — Lingerie Tips, Guides & Stories | ${BRAND.name}` },
  description:
    "Expert tips on choosing the right bra, nightwear styles, fabric care and more — the Raks Journal helps you shop smarter and feel your best.",
  alternates: { canonical: absoluteUrl("/blogs/") },
}

export default function BlogIndex() {
  const posts = getAllPosts()
  const [featured, ...rest] = posts

  return (
    <div className="pb-20">
      <header className="bg-cream-100">
        <div className="content-container py-14 lg:py-20 text-center">
          <p className="text-xs uppercase tracking-luxe text-bronze-600 mb-3">The Raks Journal</p>
          <h1 className="font-display text-5xl sm:text-6xl text-ink">Tips, Guides &amp; Stories</h1>
          <p className="mt-4 text-ink/60 max-w-xl mx-auto">
            Everything on fit, fabric, care and confidence — written for women in Pakistan.
          </p>
        </div>
      </header>

      <div className="content-container py-14">
        {/* featured post */}
        {featured && (
          <LocalizedClientLink href={featured.url} className="group grid lg:grid-cols-2 gap-8 mb-16 items-center">
            <div className="aspect-[16/11] overflow-hidden rounded-large bg-bronze-100">
              {featured.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-bronze-600 mb-3">
                Latest · {formatDate(featured.date)}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight group-hover:text-bronze-600 transition-colors">
                {featured.title}
              </h2>
              <p className="mt-4 text-ink/65 leading-relaxed line-clamp-3">{featured.excerpt}</p>
              <span className="inline-block mt-5 text-sm uppercase tracking-wider text-bronze-600 border-b border-bronze-300 pb-0.5">
                Read article →
              </span>
            </div>
          </LocalizedClientLink>
        )}

        {/* grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
          {rest.map((post) => (
            <LocalizedClientLink key={post.slug} href={post.url} className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-large bg-bronze-100 mb-4">
                {post.thumbnail && (
                  // Lazy: this grid renders every remaining post, so eager
                  // loading pulled ~116 full-size originals (~76MB) at once.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail} alt={post.title} loading="lazy" decoding="async" width={640} height={400} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
              </div>
              <p className="text-[11px] uppercase tracking-wider text-bronze-600 mb-2">{formatDate(post.date)}</p>
              <h3 className="font-display text-xl text-ink leading-snug group-hover:text-bronze-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-ink/55 line-clamp-2">{post.excerpt}</p>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </div>
  )
}
