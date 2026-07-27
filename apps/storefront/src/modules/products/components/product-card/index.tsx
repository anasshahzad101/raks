"use client"

import Image from "next/image"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"

/**
 * Editorial product card matching the RAKS reference design: a 3:4 image with
 * a hover lift + zoom, a wishlist heart, an optional corner badge, an
 * "Add to Bag" reveal, and a centered category / name / price block below.
 * Uses the real product photo; falls back to the brand watermark tile when a
 * product has no image.
 */

const GRADIENTS = [
  "linear-gradient(150deg,#7a1d3a,#4a0e1f)",
  "linear-gradient(150deg,#6d1430,#3a0a19)",
  "linear-gradient(150deg,#8a2244,#521026)",
  "linear-gradient(150deg,#5c1128,#2a0912)",
]

function gradientFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function WatermarkTile({ id }: { id: string }) {
  return (
    <div className="absolute inset-0" style={{ background: gradientFor(id) }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 22%,rgba(255,255,255,.16),transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(140deg,rgba(255,255,255,.07),transparent 38%,rgba(0,0,0,.14))",
        }}
      />
      <div className="absolute inset-[15px] border border-white/20" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-[62%] flex-col items-center gap-2.5">
        <span className="font-arabic text-[46px] leading-none text-white/70">
          رقـص
        </span>
        <span className="h-px w-[30px] bg-white/45" />
        <span className="pl-[0.4em] text-[8.5px] uppercase tracking-[0.4em] text-white/60">
          Raks Lingerie
        </span>
      </div>
    </div>
  )
}

type Badge = { label: string; bg: string; fg: string }

export default function ProductCard({
  product,
}: {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
}) {
  const [favourite, setFavourite] = useState(false)

  const { cheapestPrice } = getProductPrice({ product })
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  const priceMissing = meta.price_missing === true || meta.price_missing === "true"
  const onSale = cheapestPrice?.price_type === "sale"

  // Prefer the most specific category for the label — products sit in both the
  // root ("Lingerie"/"Nightdress") and a shopping subcategory ("Bras"), and the
  // array order isn't guaranteed, so skip the roots when a child exists.
  const cats = product.categories ?? []
  const category = (
    cats.find((c) => !/^(lingerie|nightdress)$/i.test(c.name ?? "")) ?? cats[0]
  )?.name
  const href = `/product/${product.handle}/`
  const image = product.thumbnail || product.images?.[0]?.url

  // One corner badge, in priority order: sale → bridal → new.
  const isBridal =
    /bridal/i.test(category ?? "") ||
    (product.tags ?? []).some((t) => /bridal/i.test(t.value ?? ""))
  const createdAt = product.created_at ? new Date(product.created_at).getTime() : 0
  const isNew =
    createdAt > 0 && Date.now() - createdAt < 1000 * 60 * 60 * 24 * 30

  const badge: Badge | null = onSale
    ? { label: "Sale", bg: "#6d1430", fg: "#fffdf9" }
    : isBridal
    ? { label: "Bridal", bg: "#2a1117", fg: "#fffdf9" }
    : isNew
    ? { label: "New", bg: "#bb8a45", fg: "#2a1117" }
    : null

  return (
    <div className="group relative bg-cream-50 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(42,17,23,0.55)]">
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream-200">
        {image ? (
          <Image
            src={image}
            alt={product.title ?? ""}
            fill
            quality={60}
            sizes="(max-width:1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <WatermarkTile id={product.id} />
        )}

        {badge && (
          <span
            className="absolute left-0 top-3 z-20 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ background: badge.bg, color: badge.fg }}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist heart */}
        <button
          type="button"
          aria-label={favourite ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={favourite}
          onClick={() => setFavourite((v) => !v)}
          className="absolute right-3 top-3 z-20 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-cream-50/85 backdrop-blur-sm transition-colors hover:bg-cream-50"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill={favourite ? "#6d1430" : "none"}
            stroke={favourite ? "#6d1430" : "#2a1117"}
            strokeWidth="1.7"
          >
            <path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2 4.8 5.4 4.5 7.7 4.3 9.4 5.7 12 8c2.6-2.3 4.3-3.7 6.6-3.5C22 4.8 23.5 8.4 22 11.7 19.5 16.4 12 21 12 21z" />
          </svg>
        </button>

        {/* Add to Bag — revealed on hover */}
        <div className="absolute inset-x-3 bottom-3 z-20 translate-y-2 opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:translate-y-0 group-hover:opacity-100">
          <LocalizedClientLink
            href={href}
            className="block w-full bg-ink py-3.5 text-center text-[12px] font-medium uppercase tracking-[0.16em] text-cream-50 transition-colors hover:bg-accent"
          >
            Add to Bag
          </LocalizedClientLink>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col items-center px-1.5 pb-4 pt-5 text-center">
        {category && (
          <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            {category}
          </div>
        )}
        <h3 className="line-clamp-2 min-h-[2.7em] text-[14.5px] leading-[1.5] text-ink transition-colors group-hover:text-accent">
          {product.title}
        </h3>
        <div className="mt-3 flex items-baseline justify-center gap-x-2.5">
          {priceMissing ? (
            <span className="text-[13px] italic text-ink/50">Price on request</span>
          ) : (
            cheapestPrice && (
              <>
                <span className="text-[15px] font-medium text-accent">
                  {cheapestPrice.calculated_price}
                </span>
                {onSale && (
                  <span className="text-[13px] text-ink/35 line-through">
                    {cheapestPrice.original_price}
                  </span>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Full-card link overlay (crawlable, sits below the interactive buttons) */}
      <LocalizedClientLink
        href={href}
        aria-label={product.title ?? "View product"}
        className="absolute inset-0 z-10"
      />
    </div>
  )
}
