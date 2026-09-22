"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductCard from "@modules/products/components/product-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { trackEvent } from "@lib/analytics"
import type { SizeLookup } from "@lib/util/slim-product"
import {
  BraSizeSuccess,
  Unit,
  calculateBraSize,
  sisterSizeRun,
} from "@lib/util/bra-size"
import MeasureGuide from "./measure-guide"
import SizeGrid from "./size-grid"

/**
 * The interactive half of /bra-size-calculator/.
 *
 * Takes the bra catalogue already slimmed for cards plus its precomputed size
 * labels, so choosing a size filters instantly with no request and no reload —
 * the same arrangement the category page uses, for the same reason (deriving
 * sizes on the client means shipping every product's option graph in the RSC
 * payload).
 *
 * Two things shape the design. The result is not just a size: a shopper told
 * "36C" and left to go hunting has been given homework, so the products in that
 * size sit directly underneath. And the size is worked out as you type rather
 * than on a button press — the button stays for people who expect one, but the
 * answer should not be behind a click when it can be behind a keystroke.
 */

type Props = {
  products: HttpTypes.StoreProduct[]
  sizesByProduct: SizeLookup
  region?: HttpTypes.StoreRegion
  /** Resolved path of the Bras category, for the "browse everything" link. */
  braCategoryPath: string
}

/** How many product cards to show under a size before offering the rest. */
const MAX_CARDS = 6

export default function BraSizeCalculator({
  products,
  sizesByProduct,
  region,
  braCategoryPath,
}: Props) {
  const [unit, setUnit] = useState<Unit>("in")
  const [underbust, setUnderbust] = useState("")
  const [bust, setBust] = useState("")
  /** Which field has focus, for the measuring figure. */
  const [focused, setFocused] = useState<"underbust" | "bust" | null>(null)
  /**
   * Errors are held back until a field has been left or the form submitted.
   * Validating on every keystroke means telling someone their measurement is
   * out of range while they are still typing the first digit of it.
   */
  const [showErrors, setShowErrors] = useState(false)
  /** The size whose products are shown — the result, or one picked from the grid. */
  const [picked, setPicked] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const sizesOf = (id: string) => sizesByProduct[id] ?? []

  /* --------------------------------------------------------- calculation */

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

  /** The result wins until the shopper picks a different cell on the grid. */
  const activeSize = picked ?? result?.label ?? null

  // A new size clears the expanded grid of cards, so switching sizes does not
  // leave twelve cards open from the last one.
  useEffect(() => {
    setShowAll(false)
  }, [activeSize])

  // Picking from the grid then editing the measurements should hand control
  // back to the calculation rather than stranding the old pick on screen.
  useEffect(() => {
    setPicked(null)
  }, [underbust, bust, unit])

  /**
   * One analytics event per size arrived at, not one per keystroke.
   *
   * Measurements are body data. The event records the size bucket and whether
   * it was stocked — what the shop needs in order to buy stock — and never the
   * numbers that were typed in.
   */
  useEffect(() => {
    if (!result) return
    const label = result.label
    const timer = setTimeout(() => {
      trackEvent("bra_size_calculated", {
        bra_size: label,
        band: result.band,
        cup: result.cup,
        unit,
        in_stock: products.some((p) => sizesOf(p.id).includes(label)),
      })
    }, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.label])

  const reset = () => {
    setUnderbust("")
    setBust("")
    setPicked(null)
    setShowErrors(false)
    setShowAll(false)
  }

  /* ------------------------------------------------------------ matching */

  const countFor = (label: string) =>
    products.filter((p) => sizesOf(p.id).includes(label)).length

  const exactMatches = useMemo(() => {
    if (!activeSize) return []
    return products.filter((p) => sizesOf(p.id).includes(activeSize))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sizesByProduct, activeSize])

  /**
   * Bras listed by band alone, with no cup option, that carry this band.
   *
   * Kept separate from the exact matches and labelled as such: a bra sold in
   * "34" with no cup is a different promise from one sold in 34C, and merging
   * them would quietly overstate what is available in the shopper's size.
   */
  const bandMatches = useMemo(() => {
    const band = activeSize ? parseInt(activeSize, 10) : NaN
    if (Number.isNaN(band)) return []
    const key = String(band)
    return products.filter((p) => {
      const sizes = sizesOf(p.id)
      return (
        sizes.includes(key) && !sizes.some((s) => s.startsWith(key) && s !== key)
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sizesByProduct, activeSize])

  const sisters = useMemo(
    () => (result ? sisterSizeRun(result.band, result.cup, 1) : []),
    [result]
  )
  const sisterLabels = sisters.map((s) => s.label)

  /** Sister sizes with stock behind them, for the nothing-in-your-size case. */
  const stockedSisters = useMemo(
    () =>
      result
        ? sisterSizeRun(result.band, result.cup).filter(
            (s) => countFor(s.label) > 0
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, sizesByProduct, result]
  )

  /* -------------------------------------------------------------- render */

  const unitLabel = unit === "cm" ? "cm" : "in"
  const visibleError = showErrors ? error : null

  const fieldClass = (field: "underbust" | "bust") =>
    `w-full border bg-white px-4 py-3.5 text-[17px] text-ink outline-none transition-colors placeholder:text-[15px] placeholder:text-ink/25 focus:border-accent ${
      visibleError?.field === field ? "border-accent" : "border-cream-300"
    }`

  return (
    <div className="overflow-hidden border border-cream-300 bg-[#fffdf9]">
      {/* ------------------------------------------------------------ form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setShowErrors(true)
          if (result) resultRef.current?.focus()
        }}
        className="grid gap-8 p-6 sm:grid-cols-[1fr_196px] sm:items-center sm:gap-8 small:gap-12 small:p-8"
      >
        <div>
          <fieldset className="mb-6">
            <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
              Measure in
            </legend>
            <div className="inline-flex border border-cream-300">
              {(["in", "cm"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={`px-5 py-2 text-[13px] transition-colors ${
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

          <div className="grid gap-5 sm:grid-cols-2">
            {(
              [
                {
                  id: "underbust" as const,
                  label: "Underbust",
                  value: underbust,
                  set: setUnderbust,
                  help: "Snug, directly under your bust, tape level all the way round.",
                  placeholder: unit === "cm" ? "76" : "30",
                },
                {
                  id: "bust" as const,
                  label: "Bust",
                  value: bust,
                  set: setBust,
                  help: "Across the fullest part, loose enough not to squash.",
                  placeholder: unit === "cm" ? "91" : "36",
                },
              ]
            ).map((f) => (
              <div key={f.id}>
                <label
                  htmlFor={f.id}
                  className="mb-2 block text-[13px] font-medium text-ink"
                >
                  {f.label}{" "}
                  <span className="font-normal text-ink/45">({unitLabel})</span>
                </label>
                <div className="relative">
                  <input
                    id={f.id}
                    name={f.id}
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    required
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    onFocus={() => setFocused(f.id)}
                    onBlur={() => {
                      setFocused(null)
                      setShowErrors(true)
                    }}
                    aria-describedby={`${f.id}-help`}
                    className={fieldClass(f.id)}
                    placeholder={f.placeholder}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-ink/35"
                  >
                    {unitLabel}
                  </span>
                </div>
                <p id={`${f.id}-help`} className="mt-2 text-[12.5px] text-ink/55">
                  {f.help}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="bg-accent px-8 py-3 text-[12px] uppercase tracking-[0.18em] text-cream-50 transition-opacity hover:opacity-90"
            >
              Calculate my size
            </button>
            {(underbust || bust) && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] uppercase tracking-[0.18em] text-gold-deep underline underline-offset-4 transition-colors hover:text-accent"
              >
                Start again
              </button>
            )}
          </div>

          {/* Measurements stay in the browser. Worth saying where someone is
              about to type them in. */}
          <p className="mt-5 text-[12px] text-ink/45">
            Worked out in your browser. Nothing is sent to us or stored.
          </p>
        </div>

        {/* Beside the fields from tablet up. On a phone it sits above them at
            a smaller size — a first-time measurer needs the picture more than
            they need the inputs one scroll higher. */}
        <div className="order-first mx-auto w-[150px] sm:order-none sm:mx-0 sm:w-full">
          <MeasureGuide active={focused} />
        </div>
      </form>

      {/* ---------------------------------------------------------- result */}
      <div
        ref={resultRef}
        tabIndex={-1}
        aria-live="polite"
        className="outline-none"
      >
        {visibleError && (
          <div className="border-t border-cream-300 bg-accent/[0.04] px-6 py-5 small:px-8">
            <p className="text-[14px] text-ink">{visibleError.error}</p>
          </div>
        )}

        {result && (
          <div className="border-t border-cream-300 bg-gradient-to-b from-cream-100/60 to-transparent px-6 py-8 small:px-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
              Your estimated size
            </p>

            {/* Band and cup as two tiles rather than one run-on sentence: the
                whole point of the page is that a bra size is two numbers that
                move independently, and this is where that is easiest to show. */}
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex items-stretch gap-2">
                {[
                  { value: result.band, caption: "Band" },
                  { value: result.cup, caption: "Cup" },
                ].map((tile) => (
                  <div
                    key={tile.caption}
                    className="min-w-[78px] border border-cream-300 bg-[#fffdf9] px-4 py-3 text-center"
                  >
                    <span className="block font-display text-4xl leading-none text-ink">
                      {tile.value}
                    </span>
                    <span className="mt-2 block text-[10px] uppercase tracking-[0.18em] text-ink/45">
                      {tile.caption}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex min-w-[110px] flex-col items-center justify-center border border-accent bg-accent px-5 py-3 text-center">
                <span className="block font-display text-4xl leading-none text-cream-50">
                  {result.label}
                </span>
                <span className="mt-2 block text-[10px] uppercase tracking-[0.18em] text-cream-50/70">
                  Your size
                </span>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-ink/70">
              The band comes from your underbust. The cup comes from the{" "}
              {result.differenceInches}-inch difference between your bust and
              that band.
            </p>

            {result.notes.map((note) => (
              <p
                key={note}
                className="mt-4 max-w-xl border-l-2 border-gold pl-4 text-[13.5px] leading-relaxed text-ink/70"
              >
                {note}
              </p>
            ))}

            {sisters.length > 0 && (
              <p className="mt-5 max-w-xl text-[13.5px] leading-relaxed text-ink/60">
                Sister sizes:{" "}
                {sisters.map((s, i) => (
                  <span key={s.label}>
                    {i > 0 && " and "}
                    <button
                      type="button"
                      onClick={() => setPicked(s.label)}
                      className="font-medium text-accent underline underline-offset-4 hover:opacity-70"
                    >
                      {s.label}
                    </button>
                  </span>
                ))}
                . Same cup volume, looser or tighter band — try one if the band
                rides up or digs in.
              </p>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- products */}
        {activeSize && (
          <div className="border-t border-cream-300 px-6 py-8 small:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 className="font-display text-2xl text-ink">
                {exactMatches.length > 0
                  ? `Bras in ${activeSize}`
                  : `Nothing in ${activeSize} right now`}
              </h2>
              {exactMatches.length > 0 && (
                <p className="text-[13px] text-ink/55">
                  {exactMatches.length}{" "}
                  {exactMatches.length === 1 ? "style" : "styles"}
                  {picked && result && picked !== result.label
                    ? ` · not your calculated size (${result.label})`
                    : ""}
                </p>
              )}
            </div>

            {exactMatches.length > 0 ? (
              <>
                <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 small:grid-cols-3">
                  {(showAll
                    ? exactMatches
                    : exactMatches.slice(0, MAX_CARDS)
                  ).map((p) => (
                    <li key={p.id}>
                      <ProductCard product={p} region={region} />
                    </li>
                  ))}
                </ul>
                {/* Expands in place rather than linking out. The category page
                    has no size in its URL, so "see all 9 in 34C" would land on
                    every bra in the shop and lose the size the shopper came
                    for. */}
                {exactMatches.length > MAX_CARDS && !showAll && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="mt-7 border border-cream-300 px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    Show all {exactMatches.length} in {activeSize}
                  </button>
                )}
              </>
            ) : (
              <div className="mt-3 max-w-xl">
                <p className="text-[14px] leading-relaxed text-ink/70">
                  We do not have this size listed at the moment.
                  {stockedSisters.length > 0
                    ? " Your sister sizes are available, and the cup holds roughly the same amount:"
                    : ""}
                </p>
                {stockedSisters.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stockedSisters.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setPicked(s.label)}
                        className="border border-cream-300 bg-[#fffdf9] px-4 py-2 text-[13px] text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <LocalizedClientLink
                  href={braCategoryPath}
                  className="mt-6 inline-block text-[11px] uppercase tracking-[0.18em] text-gold-deep underline underline-offset-4 transition-colors hover:text-accent"
                >
                  Browse all bras →
                </LocalizedClientLink>
              </div>
            )}

            {bandMatches.length > 0 && (
              <div className="mt-10 border-t border-cream-200 pt-8">
                <h3 className="font-display text-xl text-ink">
                  Also listed in size {parseInt(activeSize, 10)}
                </h3>
                <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink/60">
                  Sold by band alone, without a separate cup size, so they are
                  worth a look but are not a cup-for-cup match.
                </p>
                <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 small:grid-cols-3">
                  {bandMatches.slice(0, MAX_CARDS).map((p) => (
                    <li key={p.id}>
                      <ProductCard product={p} region={region} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- size grid */}
      <div className="border-t border-cream-300 px-6 py-8 small:px-8">
        {/* Names what it is AND what it is for. "Every size we stock" alone
            was clear on the page and invisible in search — it did not contain
            the phrase anyone types to find a chart like this. */}
        <h2 id="size-grid" className="font-display text-2xl text-ink">
          Bra size chart — every size we stock
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink/65">
          Bands down the side, cups across the top. Tap any size to see the bras
          listed in it.
        </p>
        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
          Sister sizes
        </h3>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink/65">
          Sister sizes sit diagonally from each other on this chart — one band
          down is one cup up, so 34C, 32D and 36B all hold about the same
          amount. They are what to try when the cup fits but the band does not.
        </p>
        <div className="mt-6">
          <SizeGrid
            countFor={countFor}
            selected={activeSize}
            sisterLabels={sisterLabels}
            yourSize={result?.label ?? null}
            onSelect={setPicked}
          />
        </div>
      </div>
    </div>
  )
}
