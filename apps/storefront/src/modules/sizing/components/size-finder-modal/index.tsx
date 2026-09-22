"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { trackEvent } from "@lib/analytics"
import {
  BraSizeSuccess,
  Unit,
  calculateBraSize,
  sisterSizeRun,
} from "@lib/util/bra-size"

/**
 * The bra size calculator, as a dialog on a product page.
 *
 * Deliberately not the whole /bra-size-calculator/ page in a box. A shopper who
 * opens this is already looking at one bra and has one question — does this come
 * in my size — so the answer is about THIS product, and picking a size closes
 * the dialog with that size selected rather than sending them off to a chart.
 * The charts, the grid and the rest stay on the page, one link away.
 *
 * The maths is the same `calculateBraSize` the page uses, so the two cannot give
 * different answers.
 */

type Props = {
  /** Size labels this product is listed in, e.g. ["34B","34C","36B"]. */
  productSizes: string[]
  /** Product title, for the copy and the analytics event. */
  productTitle: string
  /** Applies a size to the product's option selector, then the dialog closes. */
  onSelectSize: (label: string) => void
  onClose: () => void
}

export default function SizeFinderModal({
  productSizes,
  productTitle,
  onSelectSize,
  onClose,
}: Props) {
  const [unit, setUnit] = useState<Unit>("in")
  const [underbust, setUnderbust] = useState("")
  const [bust, setBust] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const calculated = useMemo(
    () =>
      underbust.trim() && bust.trim()
        ? calculateBraSize({
            underbust: parseFloat(underbust),
            bust: parseFloat(bust),
            unit,
          })
        : null,
    [underbust, bust, unit]
  )
  const result: BraSizeSuccess | null =
    calculated && calculated.ok ? calculated : null
  const error = calculated && !calculated.ok ? calculated : null

  const hasSize = result ? productSizes.includes(result.label) : false

  /** Sister sizes this particular product is actually made in. */
  const availableSisters = useMemo(
    () =>
      result
        ? sisterSizeRun(result.band, result.cup).filter((s) =>
            productSizes.includes(s.label)
          )
        : [],
    [result, productSizes]
  )

  // One event per size arrived at, not one per keystroke. Records the size and
  // whether this product carries it — which is what tells the shop it is losing
  // sales to a size gap — and never the measurements themselves.
  useEffect(() => {
    if (!result) return
    const label = result.label
    const timer = setTimeout(() => {
      trackEvent("bra_size_calculated", {
        bra_size: label,
        band: result.band,
        cup: result.cup,
        unit,
        in_stock: productSizes.includes(label),
        context: "product_page",
        item_name: productTitle,
      })
    }, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.label])

  // Escape closes, and focus starts in the first field rather than on the
  // dialog container, so a keyboard user can type immediately.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    firstFieldRef.current?.focus()
    // The page behind must not scroll while a full-screen sheet is over it.
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  /** Keep Tab inside the dialog. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const unitLabel = unit === "cm" ? "cm" : "in"
  const visibleError = showErrors ? error : null

  const field = (
    id: "underbust" | "bust",
    label: string,
    value: string,
    set: (v: string) => void,
    help: string,
    placeholder: string,
    ref?: React.RefObject<HTMLInputElement | null>
  ) => (
    <div>
      <label
        htmlFor={`sf-${id}`}
        className="mb-1.5 block text-[13px] font-medium text-ink"
      >
        {label} <span className="font-normal text-ink/45">({unitLabel})</span>
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={`sf-${id}`}
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          value={value}
          onChange={(e) => set(e.target.value)}
          onBlur={() => setShowErrors(true)}
          aria-describedby={`sf-${id}-help`}
          placeholder={placeholder}
          className={`w-full border bg-white px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-[14px] placeholder:text-ink/25 focus:border-accent ${
            visibleError?.field === id ? "border-accent" : "border-cream-300"
          }`}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12.5px] text-ink/35"
        >
          {unitLabel}
        </span>
      </div>
      <p id={`sf-${id}-help`} className="mt-1.5 text-[12px] text-ink/55">
        {help}
      </p>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 small:items-center small:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-finder-title"
        onKeyDown={onKeyDown}
        className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto border border-cream-300 bg-[#fffdf9] shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-cream-200 px-6 py-5">
          <div>
            <h2
              id="size-finder-title"
              className="font-display text-2xl text-ink"
            >
              Find my size
            </h2>
            <p className="mt-1 text-[13px] text-ink/55">
              Two measurements, and we will tell you whether this style comes in
              your size.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size finder"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center text-[22px] leading-none text-ink/45 transition-colors hover:text-accent"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5">
          <fieldset className="mb-5">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
              Measure in
            </legend>
            <div className="inline-flex border border-cream-300">
              {(["in", "cm"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={`px-4 py-1.5 text-[13px] transition-colors ${
                    unit === u
                      ? "bg-accent text-cream-50"
                      : "text-ink hover:text-accent"
                  }`}
                >
                  {u === "in" ? "Inches" : "Centimetres"}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              "underbust",
              "Underbust",
              underbust,
              setUnderbust,
              "Snug, directly under your bust.",
              unit === "cm" ? "76" : "30",
              firstFieldRef
            )}
            {field(
              "bust",
              "Bust",
              bust,
              setBust,
              "Across the fullest part, loose.",
              unit === "cm" ? "91" : "36"
            )}
          </div>

          <div aria-live="polite">
            {visibleError && (
              <p className="mt-5 border-l-2 border-accent pl-4 text-[13.5px] leading-relaxed text-ink/75">
                {visibleError.error}
              </p>
            )}

            {result && (
              <div className="mt-6 border-t border-cream-200 pt-5">
                <div className="flex items-center gap-4">
                  <div className="flex min-w-[92px] flex-col items-center border border-accent bg-accent px-4 py-2.5">
                    <span className="font-display text-3xl leading-none text-cream-50">
                      {result.label}
                    </span>
                    <span className="mt-1.5 text-[9.5px] uppercase tracking-[0.16em] text-cream-50/70">
                      Your size
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink/70">
                    Band {result.band} from your underbust, cup {result.cup} from
                    the {result.differenceInches}-inch difference.
                  </p>
                </div>

                {result.notes.map((note) => (
                  <p
                    key={note}
                    className="mt-4 border-l-2 border-gold pl-4 text-[13px] leading-relaxed text-ink/70"
                  >
                    {note}
                  </p>
                ))}

                {/* The whole point of showing this here rather than on the
                    calculator page: answer it about the bra they are looking at. */}
                {hasSize ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSize(result.label)
                      onClose()
                    }}
                    className="mt-5 w-full bg-accent px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-cream-50 transition-opacity hover:opacity-90"
                  >
                    Choose {result.label} for this bra
                  </button>
                ) : (
                  <div className="mt-5">
                    <p className="text-[13.5px] leading-relaxed text-ink/75">
                      This style is not made in {result.label}.
                      {availableSisters.length > 0
                        ? " It does come in your sister sizes, which hold about the same amount:"
                        : ""}
                    </p>
                    {availableSisters.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {availableSisters.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              onSelectSize(s.label)
                              onClose()
                            }}
                            className="border border-cream-300 bg-white px-4 py-2.5 text-[13px] text-ink transition-colors hover:border-accent hover:text-accent"
                          >
                            Choose {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <LocalizedClientLink
                      href="/bra-size-calculator/"
                      className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-gold-deep underline underline-offset-4 transition-colors hover:text-accent"
                    >
                      See every bra in {result.label} →
                    </LocalizedClientLink>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-cream-200 px-6 py-4">
          <LocalizedClientLink
            href="/bra-size-calculator/"
            className="text-[12.5px] text-gold-deep underline underline-offset-4 transition-colors hover:text-accent"
          >
            Full size chart, measuring guide and sister sizes
          </LocalizedClientLink>
          <p className="mt-2 text-[11.5px] text-ink/45">
            Worked out in your browser. Nothing is sent to us or stored.
          </p>
        </div>
      </div>
    </div>
  )
}
