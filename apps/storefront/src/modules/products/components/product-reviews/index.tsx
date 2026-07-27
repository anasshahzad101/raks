import { HttpTypes } from "@medusajs/types"
import { getProductReviews } from "@lib/reviews"

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const full = Math.round(value)
  return (
    <span
      className="inline-flex tracking-[2px] leading-none"
      style={{ fontSize: size }}
      aria-label={`${value} out of 5 stars`}
    >
      <span className="text-gold">{"★".repeat(full)}</span>
      <span className="text-bronze-200">{"★".repeat(5 - full)}</span>
    </span>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#5a8a5f]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  )
}

const ProductReviews = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const { average, count, distribution, reviews } = getProductReviews(product)

  return (
    <section
      id="reviews"
      className="content-container mt-16 border-t border-cream-300 pt-12 small:mt-24 small:pt-16"
      data-testid="product-reviews"
    >
      <div className="grid gap-10 small:grid-cols-[290px_1fr] small:gap-16">
        {/* Summary */}
        <div>
          <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold">
            Reviews
          </div>
          <h2 className="mb-6 font-display text-[30px] font-medium leading-tight text-ink small:text-[34px]">
            What our customers say
          </h2>
          <div className="flex items-end gap-3">
            <span className="font-display text-[52px] leading-none text-ink">
              {average.toFixed(1)}
            </span>
            <span className="pb-2 text-[15px] text-ink/45">/ 5</span>
          </div>
          <div className="mt-3">
            <Stars value={average} size={18} />
          </div>
          <p className="mt-3 text-[13px] text-ink/55">
            Based on {count} verified reviews
          </p>

          {/* Distribution */}
          <div className="mt-6 flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = distribution[star] ?? 0
              const pct = count ? Math.round((c / count) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-3 text-[12px] text-ink/60">
                  <span className="w-8 shrink-0 tabular-nums">{star} ★</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                    <span
                      className="block h-full rounded-full bg-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Review list */}
        <div className="flex flex-col divide-y divide-cream-300">
          {reviews.map((r, i) => (
            <article key={i} className="py-6 first:pt-0">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[14.5px] font-medium text-ink">
                      {r.author}
                    </span>
                    {r.verified && <VerifiedBadge />}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink/45">{r.city}, Pakistan</div>
                </div>
                <time className="shrink-0 text-[12px] text-ink/45" dateTime={r.date}>
                  {r.dateLabel}
                </time>
              </div>
              <Stars value={r.rating} />
              <p className="mt-2 text-[14.5px] font-medium text-ink">{r.title}</p>
              <p className="mt-1 text-[14px] font-light leading-[1.7] text-[#5c4d42]">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductReviews
