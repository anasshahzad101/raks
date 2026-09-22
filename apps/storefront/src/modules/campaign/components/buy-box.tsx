"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { GA_CURRENCY, GaItem, trackEvent } from "@lib/analytics"
import { useIntersection } from "@lib/hooks/use-in-view"
import { addLocalCartItem, readLocalCart } from "@lib/local-cart"
import { metaContentPayload, trackMetaEvent } from "@lib/meta-pixel"
import type { CampaignPhoto } from "@lib/campaigns"
import { formatPKR } from "@lib/raks"
import { shippingFor } from "@lib/shipping"
import { Button, clx } from "@modules/common/components/ui"

/**
 * The purchase panel of a campaign page: image, price, colour, size, one
 * button. Adds the chosen variant to the browser-side bag and goes straight to
 * checkout — the cart page is a step this visitor does not need.
 *
 * All pricing arrives as plain numbers from the server component, which read
 * them from Medusa. Nothing here decides a price; the order endpoint re-prices
 * every line server-side anyway.
 */

export type CampaignVariant = {
  id: string
  title: string
  colour: string
  size: string
  /** The price the shopper pays, in rupees. */
  price: number
  /** The struck-through price, or null when there is nothing to strike. */
  compareAt: number | null
  image: string | null
  thumbnail: string | null
}

export type CampaignColourOption = {
  value: string
  label: string
  note: string
  image: string | null
  /** Gallery for this colour, lead photo first; empty means "just `image`". */
  photos: CampaignPhoto[]
}

/** Fired by the colour gallery further down the page; the buy box listens. */
export const COLOUR_EVENT = "raks:campaign-colour"

type Props = {
  productId: string
  handle: string
  productTitle: string
  category?: string
  eyebrow: string
  headline: string
  subheadline: string
  ctaLabel: string
  reassurance: string[]
  gift?: string
  whatsappHref: string
  /** Product thumbnail, used only when neither the variant nor the colour has a photo. */
  fallbackImage: string | null
  variants: CampaignVariant[]
  colours: CampaignColourOption[]
  sizes: string[]
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export default function BuyBox({
  productId,
  handle,
  productTitle,
  category,
  eyebrow,
  headline,
  subheadline,
  ctaLabel,
  reassurance,
  gift,
  whatsappHref,
  fallbackImage,
  variants,
  colours,
  sizes,
}: Props) {
  const router = useRouter()

  const [colour, setColour] = useState<string>(colours[0]?.value ?? "")
  const [size, setSize] = useState<string | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [hint, setHint] = useState(false)
  const [busy, setBusy] = useState(false)

  // A new colour starts from its own lead photo, not the fifth of the old one.
  useEffect(() => setPhotoIndex(0), [colour])

  const sizeRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const ctaInView = useIntersection(ctaRef, "0px")

  // A colour named in the URL (one ad per colour links here with ?color=…)
  // wins over the default. Read after mount rather than through
  // useSearchParams, which would force a Suspense boundary onto a static page.
  useEffect(() => {
    try {
      const wanted = new URLSearchParams(window.location.search).get("color")
      if (wanted && colours.some((c) => same(c.value, wanted))) {
        setColour(colours.find((c) => same(c.value, wanted))!.value)
      }
    } catch {
      // No URL access (should not happen in a browser); keep the default.
    }
  }, [colours])

  // The colour gallery lower on the page changes the selection here.
  useEffect(() => {
    const onPick = (event: Event) => {
      const value = (event as CustomEvent<string>).detail
      if (value && colours.some((c) => same(c.value, value))) setColour(value)
    }
    window.addEventListener(COLOUR_EVENT, onPick)
    return () => window.removeEventListener(COLOUR_EVENT, onPick)
  }, [colours])

  const forColour = useMemo(
    () => variants.filter((v) => same(v.colour, colour)),
    [variants, colour]
  )

  const variant = useMemo(
    () => (size ? forColour.find((v) => same(v.size, size)) : undefined),
    [forColour, size]
  )

  // With no size chosen yet, show the cheapest of the colour's variants and say
  // "from" only if they actually differ.
  const shown = variant ?? [...forColour].sort((a, b) => a.price - b.price)[0]
  const pricesDiffer =
    !variant && new Set(forColour.map((v) => v.price)).size > 1

  const price = shown?.price ?? 0
  const compareAt = shown?.compareAt ?? null
  const saving = compareAt ? compareAt - price : 0
  const savingPct = compareAt ? Math.round((saving / compareAt) * 100) : 0
  const fee = shippingFor(price)

  const activeColour = colours.find((c) => same(c.value, colour)) ?? colours[0]
  // The colour's own photo first: variants in this catalogue rarely carry one,
  // and the product thumbnail is only right for one of the colours.
  const image = activeColour?.image ?? shown?.image ?? fallbackImage

  const photos: CampaignPhoto[] = activeColour?.photos?.length
    ? activeColour.photos
    : image
    ? [{ src: image, alt: `${productTitle} in ${activeColour?.label ?? colour}` }]
    : []
  const photo = photos[Math.min(photoIndex, photos.length - 1)]

  const order = () => {
    if (!variant) {
      setHint(true)
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setBusy(true)

    const item: GaItem = {
      item_id: handle,
      item_name: productTitle,
      item_brand: "Raks",
      item_category: category,
      item_variant: variant.title,
      price: variant.price,
      quantity: 1,
    }

    // Only add once: a second tap after coming back from checkout would
    // otherwise quietly make it two of them.
    const already = readLocalCart().some((i) => i.variant_id === variant.id)

    if (!already) {
      trackEvent("add_to_cart", {
        currency: GA_CURRENCY,
        value: variant.price,
        items: [item],
      })
      trackMetaEvent(
        "AddToCart",
        metaContentPayload([item], {
          content_name: item.item_name,
          content_category: item.item_category,
        })
      )
      addLocalCartItem(
        {
          variant_id: variant.id,
          product_id: productId,
          product_handle: handle,
          product_title: productTitle,
          variant_title: variant.title,
          thumbnail: variant.thumbnail ?? image ?? fallbackImage,
          unit_price: variant.price,
        },
        1
      )
    }

    router.push("/checkout/")
  }

  const priceBlock = (compact = false) => (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        className={clx(
          "font-medium text-accent",
          compact ? "text-[22px]" : "text-[34px]"
        )}
        data-testid="campaign-price"
        data-value={price}
      >
        {pricesDiffer && (
          <span className="mr-1 text-sm font-normal text-ink/45">From</span>
        )}
        {formatPKR(price)}
      </span>
      {compareAt && (
        <span
          className={clx(
            "text-ink/40 line-through",
            compact ? "text-[14px]" : "text-[19px]"
          )}
          data-testid="campaign-original-price"
        >
          {formatPKR(compareAt)}
        </span>
      )}
      {compareAt && !compact && (
        <span className="bg-burgundy-50 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-accent">
          Save {formatPKR(saving)}
        </span>
      )}
    </div>
  )

  return (
    <section id="buy" className="content-container pb-10 pt-6 small:pb-16 small:pt-12">
      <div className="grid grid-cols-1 gap-8 small:grid-cols-[1.05fr_1fr] small:items-start small:gap-14">
        {/* Gallery. Square, so the price is one thumb-scroll away on a phone
            and the near-square collage that leads it is shown whole. Model
            photos are 9:16 and crop from the top; anything marked "contain"
            is letterboxed instead so no piece is cut off. */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden bg-cream-200">
            {photo && (
              // Plain <img>: next/image is unoptimized on this host and the
              // hero must not wait on hydration.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={768}
                height={960}
                fetchPriority={photoIndex === 0 ? "high" : undefined}
                className={clx(
                  "h-full w-full",
                  photo.fit === "contain"
                    ? "object-contain"
                    : "object-cover object-top"
                )}
              />
            )}
            {compareAt && (
              <span className="absolute left-4 top-4 bg-accent px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white">
                Save {savingPct}%
              </span>
            )}
          </div>
          {photos.length > 1 && (
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Photos"
            >
              {photos.map((p, i) => {
                const selected = i === photoIndex
                return (
                  <button
                    key={p.src}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={p.alt}
                    onClick={() => setPhotoIndex(i)}
                    className={clx(
                      "h-[72px] w-[58px] shrink-0 overflow-hidden border bg-cream-200 transition-colors",
                      selected
                        ? "border-accent"
                        : "border-transparent hover:border-bronze-200"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt=""
                      width={58}
                      height={72}
                      loading="lazy"
                      className={clx(
                        "h-full w-full",
                        p.fit === "contain"
                          ? "object-contain"
                          : "object-cover object-top"
                      )}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-3">
            <span className="text-[11.5px] uppercase tracking-[0.2em] text-gold">
              {eyebrow}
            </span>
            <h1 className="font-display text-[34px] font-medium leading-[1.1] text-ink small:text-[44px]">
              {headline}
            </h1>
            <p className="max-w-[460px] text-[15px] font-light leading-[1.75] text-[#5c4d42]">
              {subheadline}
            </p>
          </div>

          <div className="flex flex-col gap-y-1.5">
            {priceBlock()}
            <p className="text-[13px] text-ink/60">
              {fee === 0
                ? "Free delivery on this order · pay cash when it arrives"
                : `Delivery ${formatPKR(fee)} · pay cash when it arrives`}
            </p>
          </div>

          {/* Colour: a picker when there is a choice, a plain label when not */}
          <div className="flex flex-col gap-y-3">
            <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink">
              Colour · <span className="font-normal text-ink/60">{activeColour?.label}</span>
            </span>
            {colours.length > 1 && (
            <div className="flex flex-wrap gap-2.5">
              {colours.map((c) => {
                const selected = same(c.value, colour)
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColour(c.value)}
                    aria-pressed={selected}
                    className={clx(
                      "flex items-center gap-2.5 border py-2 pl-2 pr-4 text-[13px] transition-colors",
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-bronze-200 bg-[#fffdf9] text-ink hover:border-accent"
                    )}
                  >
                    {c.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 object-cover"
                      />
                    )}
                    {c.label}
                  </button>
                )
              })}
            </div>
            )}
          </div>

          {/* Size */}
          <div className="flex flex-col gap-y-3" ref={sizeRef}>
            <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink">
              Size
            </span>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((s) => {
                const available = forColour.some((v) => same(v.size, s))
                const selected = !!size && same(s, size)
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSize(s)
                      setHint(false)
                    }}
                    aria-pressed={selected}
                    className={clx(
                      "min-w-[96px] border px-5 py-3 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-bronze-200 bg-[#fffdf9] text-ink hover:border-accent"
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            {hint && (
              <p className="text-[13px] text-accent" role="status">
                Choose {sizes.join(" or ")} to continue.
              </p>
            )}
          </div>

          {/* CTA */}
          <div ref={ctaRef} className="flex flex-col gap-y-3">
            <Button
              onClick={order}
              isLoading={busy}
              variant="primary"
              className="h-[56px] w-full tracking-[0.16em]"
              data-testid="campaign-order-button"
            >
              {variant ? ctaLabel : `Select size · ${ctaLabel.split("·")[1]?.trim() ?? "Order"}`}
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="text-center text-[12.5px] text-ink/60 underline underline-offset-2 hover:text-accent"
            >
              Have a question? WhatsApp us first
            </a>
          </div>

          <ul className="flex flex-col gap-y-2 border-t border-cream-300 pt-5 text-[13.5px] text-ink/70">
            {reassurance.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-[2px] text-[#5a8a5f]">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {gift && (
            <p className="bg-[#fffdf9] border border-cream-300 px-4 py-3 text-[13px] leading-[1.6] text-ink/70">
              {gift}
            </p>
          )}
        </div>
      </div>

      {/* Sticky order bar: phones only, and only once the real button has
          scrolled away. Same handler, so the two can never disagree. */}
      <div
        className={clx(
          "fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-[#fffdf9] px-4 py-3 transition-transform duration-200 lg:hidden",
          ctaInView ? "translate-y-full" : "translate-y-0"
        )}
        aria-hidden={ctaInView}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {priceBlock(true)}
            <p className="truncate text-[11px] text-ink/55">
              {activeColour?.label}
              {variant ? ` · ${variant.size}` : ""} · cash on delivery
            </p>
          </div>
          <button
            type="button"
            onClick={order}
            disabled={busy}
            className="h-[48px] shrink-0 bg-accent px-6 text-[12px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-burgundy-dark disabled:opacity-50"
          >
            {variant ? "Order now" : "Choose size"}
          </button>
        </div>
      </div>
    </section>
  )
}
