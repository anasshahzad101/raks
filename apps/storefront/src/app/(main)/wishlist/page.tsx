import { Metadata } from "next"
import WishlistView from "@modules/wishlist/components/wishlist-view"
import { BRAND, absoluteUrl } from "@lib/raks"

export const metadata: Metadata = {
  title: { absolute: `My Wishlist | ${BRAND.name}` },
  description: "Your saved Raks lingerie & nightwear favourites.",
  alternates: { canonical: absoluteUrl("/wishlist/") },
  robots: { index: false, follow: true },
}

export default function WishlistPage() {
  return (
    <div className="content-container py-14 min-h-[60vh]">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-luxe text-bronze-600 mb-2">Saved for later</p>
        <h1 className="font-display text-5xl text-ink">My Wishlist</h1>
      </div>
      <WishlistView />
    </div>
  )
}
