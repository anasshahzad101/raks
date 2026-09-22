/**
 * Bra sizing maths for /bra-size-calculator/.
 *
 * Pure functions, no React and no catalogue access, so the numbers can be
 * reasoned about on their own. `bra-size-catalog.ts` maps a result onto
 * products; the page renders it.
 *
 * ---------------------------------------------------------------------------
 * WHICH SIZING SYSTEM THIS USES, AND WHY
 * ---------------------------------------------------------------------------
 * Two incompatible conventions are in circulation, and a calculator that picks
 * the wrong one for its own stock sends every shopper to a size the shop does
 * not sell:
 *
 *   1. The traditional "+4" method. Band = underbust + 4 (+5 when odd, so the
 *      band always lands even). Cup = bust minus band. This is what South Asian
 *      lingerie retail runs on, and what most Pakistani brand charts print.
 *
 *   2. The modern UK-fitter method (also r/ABraThatFits). Band = underbust
 *      rounded to the nearest even number, no addition. Cup = bust minus band,
 *      so the same body lands two to three cup letters higher on a smaller band.
 *
 * Raks stocks bands 32-46 and cups A-G. That range is only coherent under (1).
 * Under (2) a woman with a 28-30" underbust wears a 28 or 30 band, and a shop
 * selling to adult women would have to stock them - Raks stocks none, and its
 * cup distribution is concentrated in B and C, which is the +4 population curve
 * rather than the modern one. The catalogue is cut to the traditional system,
 * so that is what this calculates.
 *
 * No supplier has published an official chart to us, so this is inferred from
 * the size ladder rather than confirmed by the brands. The request for the real
 * charts is logged in docs/aeo/RAKS-AEO-TODO-OWNER-INPUT.md. If they come back
 * saying otherwise, change `bandFromUnderbust` and the page copy together.
 *
 * The cup ladder is the UK one (D, DD, E, F, FF, G) because the catalogue
 * contains both DD and E as distinct cups. The US ladder merges them (DD = E)
 * and continues DDD/F, which would make a listed "38E" ambiguous.
 */

export type Unit = "in" | "cm"

export const CM_PER_INCH = 2.54

/**
 * UK cup ladder, indexed by the bust-minus-band difference in whole inches.
 * Index 0 is AA (no difference), index 1 is A, and so on up.
 */
export const CUP_LADDER = [
  "AA",
  "A",
  "B",
  "C",
  "D",
  "DD",
  "E",
  "F",
  "FF",
  "G",
  "GG",
  "H",
  "HH",
  "J",
] as const

/** Bands Raks lists on adult bras. Teen sizes (14, 15) are a separate scale. */
export const STOCKED_BANDS = [32, 34, 36, 38, 40, 42, 44, 46] as const

/** Cups Raks lists. A gap here is a real gap - never silently substitute. */
export const STOCKED_CUPS = ["A", "B", "C", "D", "DD", "E", "F", "G"] as const

/**
 * Plausibility bounds, in inches. These catch typos and unit mix-ups - entering
 * centimetres while the toggle says inches lands far outside them - rather than
 * policing bodies, and are deliberately wider than anything Raks stocks.
 */
const LIMITS = {
  underbust: { min: 20, max: 60 },
  bust: { min: 22, max: 70 },
}

export type SisterSize = {
  band: number
  cup: string
  label: string
}

export type BraSizeSuccess = {
  ok: true
  /** Even band number in inches, e.g. 36. */
  band: number
  /** Cup letter from the UK ladder, e.g. "C". */
  cup: string
  /** The two joined the way the site writes sizes, e.g. "36C". */
  label: string
  /** Bust minus band, in whole inches: the number the cup letter comes from. */
  differenceInches: number
  underbustInches: number
  bustInches: number
  /** One band down, one cup up - the same cup volume on a tighter band. */
  sisterDown: SisterSize | null
  /** One band up, one cup down. */
  sisterUp: SisterSize | null
  /** Caveats worth showing beside the result. */
  notes: string[]
}

export type BraSizeFailure = {
  ok: false
  /** Shown verbatim, so it says what to do rather than what went wrong. */
  error: string
  /** Which input to highlight, when the problem is one of them. */
  field?: "underbust" | "bust"
}

export type BraSizeResult = BraSizeSuccess | BraSizeFailure

export function toInches(value: number, unit: Unit): number {
  return unit === "cm" ? value / CM_PER_INCH : value
}

export function toUnit(inches: number, unit: Unit): number {
  return unit === "cm" ? inches * CM_PER_INCH : inches
}

/**
 * Band size from an underbust measurement, traditional +4/+5 rule.
 *
 * The measurement is rounded to a whole inch first: a tape read to the half inch
 * would otherwise decide the band on its own (30.5 -> 34.5 -> 36), a full band
 * size of difference from a reading nobody takes that precisely.
 */
export function bandFromUnderbust(underbustInches: number): number {
  const whole = Math.round(underbustInches)
  return whole % 2 === 0 ? whole + 4 : whole + 5
}

/** Cup letter for a bust-minus-band difference, clamped to the ladder. */
export function cupFromDifference(differenceInches: number): string {
  const index = Math.max(
    0,
    Math.min(CUP_LADDER.length - 1, Math.round(differenceInches))
  )
  return CUP_LADDER[index]
}

function sisterSize(band: number, cupIndex: number): SisterSize | null {
  if (band < 28 || band > 56) return null
  if (cupIndex < 0 || cupIndex >= CUP_LADDER.length) return null
  const cup = CUP_LADDER[cupIndex]
  return { band, cup, label: `${band}${cup}` }
}

/**
 * The whole calculation: two measurements in, a size and its caveats out.
 *
 * Returns a failure rather than a guess whenever the inputs cannot describe a
 * real pair of measurements, because a confidently wrong size costs the shopper
 * a return and the shop a sale.
 */
export function calculateBraSize(input: {
  underbust: number
  bust: number
  unit: Unit
}): BraSizeResult {
  const { unit } = input

  if (!Number.isFinite(input.underbust) || input.underbust <= 0) {
    return {
      ok: false,
      error: "Enter your underbust measurement.",
      field: "underbust",
    }
  }
  if (!Number.isFinite(input.bust) || input.bust <= 0) {
    return { ok: false, error: "Enter your bust measurement.", field: "bust" }
  }

  const underbustInches = toInches(input.underbust, unit)
  const bustInches = toInches(input.bust, unit)

  const unitName = unit === "cm" ? "centimetres" : "inches"
  if (
    underbustInches < LIMITS.underbust.min ||
    underbustInches > LIMITS.underbust.max
  ) {
    return {
      ok: false,
      error: `That underbust measurement is outside the range this chart covers. Check you have entered ${unitName} and measured directly under the bust.`,
      field: "underbust",
    }
  }
  if (bustInches < LIMITS.bust.min || bustInches > LIMITS.bust.max) {
    return {
      ok: false,
      error: `That bust measurement is outside the range this chart covers. Check you have entered ${unitName} and measured across the fullest part.`,
      field: "bust",
    }
  }
  if (bustInches < underbustInches) {
    return {
      ok: false,
      error:
        "Your bust measurement is smaller than your underbust, so the two may have been swapped. Bust goes around the fullest part, underbust directly underneath.",
      field: "bust",
    }
  }

  const band = bandFromUnderbust(underbustInches)
  const rawDifference = Math.round(bustInches) - band
  const differenceInches = Math.max(0, rawDifference)
  const cup = cupFromDifference(differenceInches)
  const cupIndex = CUP_LADDER.indexOf(cup as (typeof CUP_LADDER)[number])

  const notes: string[] = []

  if (rawDifference < 0) {
    notes.push(
      "Your bust measures less than the band this method gives you, which puts you below an AA cup. The band is what holds a bra up, so start from the band and take the smallest cup available."
    )
  }
  if (rawDifference >= CUP_LADDER.length) {
    notes.push(
      `A ${rawDifference}-inch difference is larger than this chart goes, so ${
        CUP_LADDER[CUP_LADDER.length - 1]
      } is the largest cup it can show. Measure again with the tape level and snug before ordering.`
    )
  }
  if (!STOCKED_BANDS.includes(band as (typeof STOCKED_BANDS)[number])) {
    notes.push(`Raks does not currently stock a ${band} band.`)
  } else if (!STOCKED_CUPS.includes(cup as (typeof STOCKED_CUPS)[number])) {
    notes.push(`Raks does not currently stock a ${cup} cup.`)
  }

  return {
    ok: true,
    band,
    cup,
    label: `${band}${cup}`,
    differenceInches,
    underbustInches,
    bustInches,
    sisterDown: sisterSize(band - 2, cupIndex + 1),
    sisterUp: sisterSize(band + 2, cupIndex - 1),
    notes,
  }
}

/**
 * Rows for the band chart on the page: what underbust maps to what band.
 *
 * Generated from `bandFromUnderbust` rather than typed out, so the printed chart
 * cannot disagree with the calculator sitting above it.
 */
export function bandChartRows(): {
  underbustIn: string
  underbustCm: string
  band: number
}[] {
  const rows: { underbustIn: string; underbustCm: string; band: number }[] = []
  for (const band of STOCKED_BANDS) {
    // Every whole-inch underbust that the +4/+5 rule sends to this band.
    const matches: number[] = []
    for (let u = LIMITS.underbust.min; u <= LIMITS.underbust.max; u++) {
      if (bandFromUnderbust(u) === band) matches.push(u)
    }
    if (!matches.length) continue
    const lo = matches[0]
    const hi = matches[matches.length - 1]
    rows.push({
      underbustIn: lo === hi ? `${lo}` : `${lo}-${hi}`,
      underbustCm:
        lo === hi
          ? `${Math.round(lo * CM_PER_INCH)}`
          : `${Math.round(lo * CM_PER_INCH)}-${Math.round(hi * CM_PER_INCH)}`,
      band,
    })
  }
  return rows
}

/**
 * Rows for the cup chart: difference between bust and band, then cup letter.
 *
 * Walks the ladder without gaps rather than listing only the stocked cups. Raks
 * skips FF, so a stocked-only chart runs 7 inches to F then 9 inches to G, and a
 * reader counting inches sees a missing row and distrusts the whole table. Every
 * step is listed, and `stocked` marks which ones Raks sells.
 */
export function cupChartRows(): {
  difference: string
  differenceCm: string
  cup: string
  stocked: boolean
}[] {
  const highest = STOCKED_CUPS.reduce(
    (max, cup) =>
      Math.max(max, CUP_LADDER.indexOf(cup as (typeof CUP_LADDER)[number])),
    0
  )
  const rows: {
    difference: string
    differenceCm: string
    cup: string
    stocked: boolean
  }[] = []
  // From index 1 (A). AA is a 0-inch difference and is not a size Raks lists.
  for (let diff = 1; diff <= highest; diff++) {
    const cup = CUP_LADDER[diff]
    rows.push({
      difference: `${diff}`,
      differenceCm: `${Math.round(diff * CM_PER_INCH)}`,
      cup,
      stocked: STOCKED_CUPS.includes(cup as (typeof STOCKED_CUPS)[number]),
    })
  }
  return rows
}

/**
 * The sister-size run for a size: the same cup volume on neighbouring bands.
 *
 * Used by the chart on the page and by the fallback when a size is not stocked.
 */
export function sisterSizeRun(
  band: number,
  cup: string,
  spread = 2
): SisterSize[] {
  const cupIndex = CUP_LADDER.indexOf(cup as (typeof CUP_LADDER)[number])
  if (cupIndex === -1) return []
  const out: SisterSize[] = []
  for (let step = -spread; step <= spread; step++) {
    if (step === 0) continue
    const sister = sisterSize(band + step * 2, cupIndex - step)
    if (sister) out.push(sister)
  }
  return out
}
