"use client"

import { useState } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

/**
 * Product gallery matching the reference: a vertical thumbnail strip beside a
 * large 3:4 main image. Clicking a thumbnail swaps the main image. Falls back
 * to the brand watermark tile when a product has no images.
 */
const ImageGallery = ({ images }: { images: HttpTypes.StoreProductImage[] }) => {
  const list = (images ?? []).filter((i) => i.url)
  const [active, setActive] = useState(0)
  const main = list[active] ?? list[0]
  const showThumbs = list.length > 1

  return (
    <div
      className={
        showThumbs
          ? "grid grid-cols-[62px_1fr] gap-3 small:grid-cols-[74px_1fr] small:gap-4"
          : ""
      }
    >
      {showThumbs && (
        <div className="flex flex-col gap-2.5 small:gap-3">
          {list.slice(0, 6).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === active}
              className={`relative aspect-[3/4] overflow-hidden border-2 transition-colors ${
                i === active
                  ? "border-accent"
                  : "border-transparent hover:border-bronze-200"
              }`}
            >
              <Image
                src={img.url!}
                alt=""
                fill
                sizes="74px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream-200">
        {main?.url ? (
          <Image
            src={main.url}
            alt="Product image"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 620px"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(150deg,#6d1430,#3a0a19)]">
            <span className="font-arabic text-[56px] leading-none text-white/60">
              رقـص
            </span>
            <span className="h-px w-8 bg-white/40" />
            <span className="pl-[0.4em] text-[9px] uppercase tracking-[0.4em] text-white/55">
              Raks Lingerie
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
