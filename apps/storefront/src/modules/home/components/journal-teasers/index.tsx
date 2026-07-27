import { getRecentPosts, formatDate } from "@lib/blog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function JournalTeasers() {
  const posts = getRecentPosts(3)
  if (!posts.length) return null

  return (
    <section className="content-container pt-[84px]">
      <div>
        <div className="text-center mb-11">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-3">The Journal</p>
          <h2 className="font-display font-medium text-[42px] text-ink m-0">
            Fit, comfort &amp; confidence
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <LocalizedClientLink key={post.slug} href={post.url} className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-large bg-bronze-100 mb-5">
                {post.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="text-[11px] uppercase tracking-wider text-bronze-600 mb-2">
                {formatDate(post.date)}
              </p>
              <h3 className="font-display text-2xl text-ink leading-snug group-hover:text-bronze-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-ink/60 line-clamp-2">{post.excerpt}</p>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
