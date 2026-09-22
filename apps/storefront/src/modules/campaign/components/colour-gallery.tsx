"use client"

import { COLOUR_EVENT, CampaignColourOption } from "./buy-box"

/**
 * The colour section lower on the page. Tapping a colour selects it in the
 * buy box and scrolls back up to it, so the shopper never has to find the
 * swatches again.
 */
export default function ColourGallery({
  colours,
  productTitle,
}: {
  colours: CampaignColourOption[]
  productTitle: string
}) {
  const pick = (value: string) => {
    window.dispatchEvent(new CustomEvent(COLOUR_EVENT, { detail: value }))
    document
      .getElementById("buy")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="grid grid-cols-1 gap-5 xsmall:grid-cols-3">
      {colours.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => pick(c.value)}
          className="group flex flex-col items-start gap-3 text-left"
        >
          <span className="block w-full overflow-hidden bg-cream-200">
            {c.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image}
                alt={`${productTitle} in ${c.label}`}
                width={493}
                height={493}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )}
          </span>
          <span className="font-display text-[22px] font-medium leading-none text-ink">
            {c.label}
          </span>
          <span className="text-[13.5px] font-light leading-[1.6] text-[#5c4d42]">
            {c.note}
          </span>
          <span className="text-[11.5px] uppercase tracking-[0.14em] text-accent underline-offset-4 group-hover:underline">
            Choose {c.label}
          </span>
        </button>
      ))}
    </div>
  )
}
