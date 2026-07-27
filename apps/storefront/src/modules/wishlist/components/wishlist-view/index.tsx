"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  getWishlist,
  removeFromWishlist,
  onWishlistChange,
  type WishlistItem,
} from "@lib/wishlist"

export default function WishlistView() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(getWishlist())
    setReady(true)
    return onWishlistChange(() => setItems(getWishlist()))
  }, [])

  if (!ready) return null

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <p className="text-ink/60 mb-6">Your wishlist is empty.</p>
        <LocalizedClientLink
          href="/shop/"
          className="inline-flex items-center justify-center bg-ink text-cream-50 px-8 py-3.5 text-sm uppercase tracking-wider hover:bg-bronze-600 transition-colors rounded-full"
        >
          Discover the collection
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
      {items.map((item) => (
        <div key={item.handle} className="group relative">
          <LocalizedClientLink href={`/product/${item.handle}/`} className="block">
            <div className="overflow-hidden rounded-rounded bg-cream-100 aspect-[3/4]">
              {item.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </div>
            <h3 className="text-[13.5px] leading-snug text-ink/90 line-clamp-2 mt-3">
              {item.title}
            </h3>
            {item.price && <p className="text-sm text-ink mt-1">{item.price}</p>}
          </LocalizedClientLink>
          <button
            onClick={() => removeFromWishlist(item.handle)}
            aria-label="Remove from wishlist"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-cream-50/90 backdrop-blur flex items-center justify-center text-ink/60 hover:text-bronze-600 shadow"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
