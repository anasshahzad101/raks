"use client"

import { STOCKED_BANDS, STOCKED_CUPS } from "@lib/util/bra-size"

/**
 * Every size Raks lists, as a band-by-cup grid you can click.
 *
 * This replaces two things that were doing the job badly: a flat cup chart, and
 * a 24-row sister-size table that spelled out in prose what the grid shows by
 * position. Sister sizes ARE the diagonal — one band down and one cup up is the
 * cell up-and-right — so marking them on the grid explains the idea in a way a
 * list of triples never does.
 *
 * It also answers the question the tables could not: whether a size exists here.
 * A cell with no stock is visibly empty rather than looking identical to one
 * with nine styles behind it.
 *
 * Rendered as a real <table> with proper headers and scopes, because this is
 * the "bra size chart" the page is meant to rank for; it has to be in the HTML
 * and make sense without the interactivity.
 */
export default function SizeGrid({
  countFor,
  selected,
  sisterLabels,
  yourSize,
  onSelect,
}: {
  /** How many styles are listed in a given size label, e.g. "34C". */
  countFor: (label: string) => number
  /** The size whose products are currently shown. */
  selected: string | null
  /** Sister sizes of the calculated size, to outline. */
  sisterLabels: string[]
  /** The calculated size, marked apart from whatever is merely selected. */
  yourSize: string | null
  onSelect: (label: string) => void
}) {
  return (
    <div>
      {/* No negative-margin bleed here. With one, the scroller's own left
          padding is not covered by the sticky band column, so scrolled cells
          show through beside it. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] border-separate border-spacing-1">
          <caption className="sr-only">
            Every bra size Raks lists, by band and cup, showing how many styles
            are available in each
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 w-9 bg-[#fffdf9]"
              >
                <span className="sr-only">Band</span>
              </th>
              {STOCKED_CUPS.map((cup) => (
                <th
                  key={cup}
                  scope="col"
                  className="pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50"
                >
                  {cup}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STOCKED_BANDS.map((band) => (
              <tr key={band}>
                {/* Sticky so the band stays readable once the grid is
                    scrolled sideways on a phone — a cell reading "DD" with the
                    band gone tells you nothing. */}
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[#fffdf9] pr-2 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50"
                >
                  {band}
                </th>
                {STOCKED_CUPS.map((cup) => {
                  const label = `${band}${cup}`
                  const count = countFor(label)
                  const isYours = yourSize === label
                  const isSelected = selected === label
                  const isSister = sisterLabels.includes(label)

                  // Four states, in priority order: your size, the size being
                  // shown, a sister of your size, everything else. Stock is a
                  // second axis on top of those.
                  const base =
                    "relative flex h-11 w-full items-center justify-center border text-[12.5px] transition-all duration-150"
                  const tone = isYours
                    ? "border-accent bg-accent text-cream-50 font-medium shadow-[0_2px_10px_rgba(109,20,48,0.25)]"
                    : isSelected
                      ? "border-accent bg-accent/10 text-accent font-medium"
                      : isSister
                        ? "border-gold bg-gold/[0.07] text-ink"
                        : count > 0
                          ? "border-cream-300 bg-[#fffdf9] text-ink/80 hover:border-accent hover:text-accent"
                          : "border-transparent bg-cream-100/50 text-ink/25"

                  if (!count) {
                    return (
                      <td key={cup} className="p-0">
                        <span
                          className={`${base} ${tone} cursor-default`}
                          title={`${label} — not stocked`}
                        >
                          {label}
                        </span>
                      </td>
                    )
                  }

                  return (
                    <td key={cup} className="p-0">
                      <button
                        type="button"
                        onClick={() => onSelect(label)}
                        aria-pressed={isSelected}
                        aria-label={`${label}, ${count} ${
                          count === 1 ? "style" : "styles"
                        }${isYours ? ", your calculated size" : ""}`}
                        title={`${count} ${
                          count === 1 ? "style" : "styles"
                        } in ${label}`}
                        className={`${base} ${tone} cursor-pointer`}
                      >
                        {label}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink/55">
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-accent bg-accent" />
          Your size
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-gold bg-gold/[0.07]" />
          Sister size
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-cream-300 bg-[#fffdf9]" />
          Available — tap to shop
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 bg-cream-100" />
          Not stocked
        </li>
      </ul>
    </div>
  )
}
