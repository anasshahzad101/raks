"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import { Button } from "@modules/common/components/ui"

const Star = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z"
      fill={filled ? "#ba8366" : "none"}
      stroke="#ba8366"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Reviews tab. The list is an empty state until a reviews module is wired up;
 * the submission form is front-end only — hook `onSubmit` to a backend endpoint
 * to persist reviews.
 */
const ProductReviews = ({
  product: _product,
}: {
  product: HttpTypes.StoreProduct
}) => {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: POST to a reviews endpoint once a reviews module is available.
    setSubmitted(true)
  }

  return (
    <div className="grid grid-cols-1 gap-12 large:grid-cols-2">
      {/* Existing reviews / empty state */}
      <div>
        <h3 className="font-display text-2xl text-ink">Customer Reviews</h3>
        <div className="mt-4 flex items-center gap-x-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} filled={false} />
            ))}
          </div>
          <span className="text-sm text-ink/50">No reviews yet</span>
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
          Be the first to share your thoughts on this piece. Your feedback helps
          other customers find their perfect fit.
        </p>
      </div>

      {/* Submission form */}
      <div className="rounded-large border border-bronze-100 bg-cream/40 p-6 small:p-8">
        {submitted ? (
          <div className="flex h-full flex-col items-start justify-center gap-y-3">
            <h4 className="font-display text-xl text-ink">Thank you!</h4>
            <p className="text-sm text-ink/60">
              Your review has been submitted and will appear once approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
            <h4 className="font-display text-xl text-ink">Write a review</h4>

            <div className="flex flex-col gap-y-2">
              <label className="text-xs uppercase tracking-luxe text-ink/60">
                Your rating
              </label>
              <div className="flex gap-x-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHover(value)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${value} star${value > 1 ? "s" : ""}`}
                    >
                      <Star filled={value <= (hover || rating)} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <label
                htmlFor="review-name"
                className="text-xs uppercase tracking-luxe text-ink/60"
              >
                Name
              </label>
              <input
                id="review-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-rounded border border-bronze-200 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label
                htmlFor="review-body"
                className="text-xs uppercase tracking-luxe text-ink/60"
              >
                Review
              </label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={4}
                className="resize-none rounded-rounded border border-bronze-200 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                placeholder="Share your experience with this product…"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className={clx("h-11 w-full small:w-auto small:self-start small:px-10", {
                "opacity-60": !rating || !name || !body,
              })}
              disabled={!rating || !name || !body}
            >
              Submit review
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProductReviews
