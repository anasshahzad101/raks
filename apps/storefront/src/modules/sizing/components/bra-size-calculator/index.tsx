"use client"

import { useMemo, useRef, useState } from "react"
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

/**
 * The interactive half of /bra-size-calculator/.
 *
 * Takes the bra catalogue already slimmed for cards plus its precomputed size
 * labels, so choosing a size filters instantly with no request and no reload —
 * the same arrangement the category page uses, for the same reason (deriving
 * sizes on the client means shipping every product's option graph in the RSC
 * payload).
 *
 * The result is deliberately not just a size. A shopper who is told "36C" and
 * then has to go hunting for it has been given homework; the products in that
 * size sit directly underneath, and when the size is not stocked the sister
 * sizes are offered by name rather than the page going quiet.
 */

type Props = {
  products: HttpTypes.StoreProduct[]
  sizesByProduct: SizeLookup
  region?: HttpTypes.StoreRegion
  /** Handle of the Bras category, for the "browse everything" fallback link. */
  braCategoryPath: string
}

/** How many product cards to show under a size before linking out. */
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
  const [result, setResult] = useState<BraSizeSuccess | null>(null)
  const [error, setError] = useState<{ message: string; field?: string } | null>(
    null
  )
  /** Which size the product list is showing — the result, or a sister size. */
  const [activeSize, setActiveSize] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  /** Switching size always collapses the list back to the first few. */
  const selectSize = (size: string) => {
    setActiveSize(size)
    setShowAll(false)
  }

  const sizesOf = (id: string) => sizesByProduct[id] ?? []

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const calculated = calculateBraSize({
      underbust: parseFloat(underbust),
      bust: parseFloat(bust),
      unit,
    })

    if (!calculated.ok) {
      setResult(null)
      setActiveSize(null)
      setError({ message: calculated.error, field: calculated.field })
      return
    }

    setError(null)
    setResult(calculated)
    selectSize(calculated.label)

    // Measurements are body data. The event records the size bucket and whether
    // it was stocked — what the shop needs to know to buy stock — and never the
    // numbers that were typed in.
    trackEvent("bra_size_calculated", {
      bra_size: calculated.label,
      band: calculated.band,
      cup: calculated.cup,
      unit,
      in_stock:
        products.filter((p) => sizesOf(p.id).includes(calculated.label)).length >
        0,
    })

    // Focus rather than scroll: it moves the viewport for everyone and puts the
    // answer at the start of the reading order for a screen reader.
    requestAnimationFrame(() => resultRef.current?.focus())
  }

  const reset = () => {
    setUnderbust("")
    setBust("")
    setResult(null)
    setError(null)
    setActiveSize(null)
    setShowAll(false)
  }

  /** Products carrying an exact band+cup label, e.g. "36C". */
  const exactMatches = useMemo(() => {
    if (!activeSize) return []
    return products.filter((p) => sizesOf(p.id).includes(activeSize))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sizesByProduct, activeSize])

  /**
   * Bras listed by band alone (no cup option) that carry this band.
   *
   * Kept separate from the exact matches and labelled as such: a bra sold in
   * "34" with no cup is a different promise from one sold in 34C, and merging
   * them would quietly overstate what is available in the shopper's size.
   */
  const bandMatches = useMemo(() => {
    if (!result) return []
    const band = String(result.band)
    return products.filter((p) => {
      const sizes = sizesOf(p.id)
      return sizes.includes(band) && !sizes.some((s) => s.startsWith(band) && s !== band)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sizesByProduct, result])

  /** Sister sizes that actually have stock behind them. */
  const stockedSisters = useMemo(() => {
    if (!result) return []
    return sisterSizeRun(result.band, result.cup).filter((s) =>
      products.some((p) => sizesOf(p.id).includes(s.label))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sizesByProduct, result])

  const inputClass = (field: string) =>
    `w-full border bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-accent ${
      error?.field === field ? "border-accent" : "border-cream-300"
    }`

  const unitLabel = unit === "cm" ? "cm" : "inches"

  return (
    <div className="border border-cream-300 bg-[#fffdf9]">
      {/* ------------------------------------------------------------ form */}
      <form onSubmit={onSubmit} className="p-6 small:p-8">
        <fieldset className="mb-6">
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
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

        <div className="grid gap-5 small:grid-cols-2">
          <div>
            <label
              htmlFor="underbust"
              className="mb-2 block text-[13px] font-medium text-ink"
            >
              Underbust ({unitLabel})
            </label>
            <input
              id="underbust"
              name="underbust"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              required
              value={underbust}
              onChange={(e) => setUnderbust(e.target.value)}
              aria-describedby="underbust-help"
              className={inputClass("underbust")}
              placeholder={unit === "cm" ? "e.g. 76" : "e.g. 30"}
            />
            <p id="underbust-help" className="mt-2 text-[12.5px] text-ink/55">
              Snug, directly under your bust, tape level all the way round.
            </p>
          </div>

          <div>
            <label
              htmlFor="bust"
              className="mb-2 block text-[13px] font-medium text-ink"
            >
              Bust ({unitLabel})
            </label>
            <input
              id="bust"
              name="bust"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              required
              value={bust}
              onChange={(e) => setBust(e.target.value)}
              aria-describedby="bust-help"
              className={inputClass("bust")}
              placeholder={unit === "cm" ? "e.g. 91" : "e.g. 36"}
            />
            <p id="bust-help" className="mt-2 text-[12.5px] text-ink/55">
              Across the fullest part, tape loose enough not to squash.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="bg-accent px-8 py-3 text-[12px] uppercase tracking-[0.18em] text-cream-50 transition-opacity hover:opacity-90"
          >
            Calculate my size
          </button>
          {(result || error) && (
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
          Your measurements are worked out in your browser. Nothing is sent to us
          or stored.
        </p>
      </form>

      {/* ---------------------------------------------------------- result */}
      <div
        ref={resultRef}
        tabIndex={-1}
        aria-live="polite"
        className="outline-none"
      >
        {error && (
          <div className="border-t border-cream-300 bg-accent/5 px-6 py-5 small:px-8">
            <p className="text-[14px] text-ink">{error.message}</p>
          </div>
        )}

        {result && (
          <div className="border-t border-cream-300 px-6 py-7 small:px-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
              Your estimated size
            </p>
            <p className="mt-2 font-display text-5xl text-ink small:text-6xl">
              {result.label}
            </p>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink/70">
              Band <strong className="text-ink">{result.band}</strong> from your
              underbust, cup <strong className="text-ink">{result.cup}</strong>{" "}
              from the {result.differenceInches}-inch difference between your
              bust and your band.
            </p>

            {result.notes.map((note) => (
              <p
                key={note}
                className="mt-4 max-w-xl border-l-2 border-gold pl-4 text-[13.5px] leading-relaxed text-ink/70"
              >
                {note}
              </p>
            ))}

            {/* Sister sizes double as the fallback when the calculated size is
                not stocked, so they are always offered, never only on failure. */}
            {(result.sisterDown || result.sisterUp) && (
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
                  If that does not fit, try
                </p>
                <div className="flex flex-wrap gap-2">
                  {[result.label, result.sisterDown?.label, result.sisterUp?.label]
                    .filter((s): s is string => Boolean(s))
                    .map((label) => {
                      const on = activeSize === label
                      const stocked = products.some((p) =>
                        sizesOf(p.id).includes(label)
                      )
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => selectSize(label)}
                          aria-pressed={on}
                          className={`border px-4 py-2 text-[13px] transition-colors ${
                            on
                              ? "border-accent bg-accent text-cream-50"
                              : "border-cream-300 text-ink hover:border-accent"
                          }`}
                        >
                          {label}
                          {label === result.label && " (your size)"}
                          {!stocked && (
                            <span className={on ? "opacity-80" : "text-ink/45"}>
                              {" "}
                              — not stocked
                            </span>
                          )}
                        </button>
                      )
                    })}
                </div>
                <p className="mt-3 max-w-xl text-[12.5px] leading-relaxed text-ink/55">
                  These are sister sizes: the cup holds about the same amount, on
                  a looser or tighter band. Go down a band and up a cup if the
                  band rides up, up a band and down a cup if it digs in.
                </p>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- products */}
        {result && activeSize && (
          <div className="border-t border-cream-300 px-6 py-8 small:px-8">
            <h2 className="font-display text-2xl text-ink">
              {exactMatches.length > 0
                ? `Bras in ${activeSize}`
                : `Nothing in ${activeSize} right now`}
            </h2>

            {exactMatches.length > 0 ? (
              <>
                <p className="mt-2 text-[13.5px] text-ink/60">
                  {exactMatches.length}{" "}
                  {exactMatches.length === 1 ? "style" : "styles"} listed in this
                  size.
                </p>
                <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 small:grid-cols-3">
                  {(showAll ? exactMatches : exactMatches.slice(0, MAX_CARDS)).map(
                    (p) => (
                      <li key={p.id}>
                        <ProductCard product={p} region={region} />
                      </li>
                    )
                  )}
                </ul>
                {/* Expands in place rather than linking out. The category page
                    has no size in its URL, so "see all 9 in 34C" would land on
                    every bra in the shop and lose the size the shopper came
                    for. */}
                {exactMatches.length > MAX_CARDS && !showAll && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="mt-7 border border-cream-300 px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent"
                  >
                    Show all {exactMatches.length} in {activeSize}
                  </button>
                )}
              </>
            ) : (
              <div className="mt-2 max-w-xl">
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
                        onClick={() => selectSize(s.label)}
                        className="border border-cream-300 px-4 py-2 text-[13px] text-ink transition-colors hover:border-accent"
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
                  Also listed in size {result.band}
                </h3>
                <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink/60">
                  These are sold by band alone, without a separate cup size, so
                  they are worth a look but are not a cup-for-cup match.
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
    </div>
  )
}
