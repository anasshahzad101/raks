import { Metadata } from "next"

import { loadBraSizeCatalog } from "@lib/util/bra-catalog"
import {
  CM_PER_INCH,
  STOCKED_BANDS,
  STOCKED_CUPS,
  bandChartRows,
  cupChartRows,
  sisterSizeRun,
} from "@lib/util/bra-size"
import { BRAND, ORG_ID, POLICY, absoluteUrl } from "@lib/raks"
import BraSizeCalculator from "@modules/sizing/components/bra-size-calculator"
import FaqSection from "@modules/common/components/faq-section"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Faq } from "@lib/faqs"
import { getAllPosts } from "@lib/blog"

/**
 * /bra-size-calculator/ — the sizing tool, and the page that has to earn the
 * search traffic for it.
 *
 * Built as one page rather than a tool plus a separate guide, because the
 * queries behind it are the same intent at different stages: "bra size
 * calculator" wants the input boxes, "bra measurement chart" wants the table,
 * "how to measure bra size" wants the steps, and "sister size calculator" wants
 * the run. All of it is server-rendered HTML so the charts are in the DOM for
 * crawlers and answer engines whether or not the calculator is ever used.
 *
 * The maths lives in `@lib/util/bra-size`, including the note on which sizing
 * system it implements and why. Do not restate the method here without reading
 * that first — the page copy and the calculation have to agree.
 */

const PATH = "/bra-size-calculator/"
const CANONICAL = absoluteUrl(PATH)

export const metadata: Metadata = {
  title: {
    absolute: `Bra Size Calculator — Find Your Size in Inches or CM | ${BRAND.name}`,
  },
  description:
    "Work out your bra size from two measurements. Enter your underbust and bust in inches or cm to get your band and cup size, your sister sizes, and the bras Raks lists in that size.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: `Bra Size Calculator | ${BRAND.name}`,
    description:
      "Find your band and cup size from your underbust and bust measurements, then see the bras available in it.",
    url: CANONICAL,
    type: "website",
  },
}

/* --------------------------------------------------------------- content */

/**
 * The measuring steps.
 *
 * Shown on the page and emitted as HowTo. Written once, because a HowTo whose
 * steps differ from the visible ones is a structured-data mismatch.
 */
const STEPS = [
  {
    name: "Take your bra off, or wear a soft unpadded one",
    text: "A padded or push-up bra adds to your bust measurement, which lands you in a cup size larger than you need.",
  },
  {
    name: "Measure your underbust",
    text: "Run the tape directly under your bust, where the band of a bra sits. Pull it snug — firm enough that it stays level when you lower your arms — and breathe out. Note the number.",
  },
  {
    name: "Measure your bust",
    text: "Run the tape around the fullest part of your bust, keeping it level across your back. This one stays loose: it should rest on you without pressing in.",
  },
  {
    name: "Enter both numbers above",
    text: "The calculator turns your underbust into a band size and the difference between the two into a cup size, and shows the bras listed in it.",
  },
]

const FAQS: Faq[] = [
  {
    question: "How do I measure my bra size at home?",
    answer:
      "You need a soft tape measure and two numbers. First measure your underbust, directly beneath your bust where the band sits, pulled snug and level. Then measure your bust across the fullest part, keeping the tape level and loose enough not to press in. Enter both into the calculator on this page and it gives you a band and cup size. Measure without a padded bra on, or the bust number comes out too large.",
  },
  {
    question: "What is my bra size if my underbust is 30 inches and my bust is 36 inches?",
    answer:
      "That is a 34B on the sizing this calculator uses. The band comes from the underbust: 30 inches is even, so 4 is added to give a 34 band. The cup comes from the difference between the bust and the band — 36 minus 34 is 2 inches, which is a B cup.",
  },
  {
    question: "How is a cup size worked out?",
    answer:
      "Each inch of difference between your bust measurement and your band size is one cup letter. No difference is AA, 1 inch is A, 2 inches is B, 3 inches is C, 4 inches is D, 5 inches is DD, 6 inches is E, 7 inches is F. The cup letter on its own means nothing without the band — a 32D and a 40D hold very different amounts.",
  },
  {
    question: "What is a sister size?",
    answer:
      "A sister size is a different band with a cup that holds about the same amount. Go down one band and up one cup, or up one band and down one cup: 36C, 34D and 38B are all sister sizes. They are the first thing to try when the cup fits but the band does not — if the band rides up your back, go down a band and up a cup; if it digs in, go up a band and down a cup.",
  },
  {
    question: "Does this calculator work in centimetres?",
    answer:
      "Yes. Switch the toggle to centimetres and enter both measurements in cm. The calculation is done in inches internally, because band and cup sizes are inch-based, and one inch is 2.54 cm.",
  },
  {
    question: "Is a bra size calculator accurate?",
    answer:
      "It gives you a reliable starting point, not a guarantee. A tape measure captures two numbers; a bra also has to suit your breast shape, and cut varies between brands and between styles from the same brand. Treat the result as the size to try first, check the fit against the signs listed on this page, and use your sister sizes if the band is right but the cup is not, or the other way round.",
  },
  {
    question: "What bra sizes does Raks carry?",
    answer: `Raks lists bands ${STOCKED_BANDS[0]} to ${
      STOCKED_BANDS[STOCKED_BANDS.length - 1]
    } and cups ${STOCKED_CUPS.join(", ")}, though not every style is made in every combination. The calculator shows you which bras are actually listed in your size, so you see the real range rather than a chart.`,
  },
  {
    question: "What if the size I calculate does not fit when it arrives?",
    answer: `Raks exchanges unworn items with their tags on within ${POLICY.exchangeWindowDays} days, so a size that turns out wrong can be swapped. Getting the measurement right first is still cheaper for everyone than an exchange.`,
  },
]

/** Signs a bra is the wrong size, grouped by what to change. */
const FIT_CHECKS = [
  {
    sign: "The band rides up your back",
    meaning: "The band is too loose.",
    fix: "Go down a band and up a cup — 38C becomes 36D.",
  },
  {
    sign: "The band digs in or leaves deep marks",
    meaning: "The band is too tight.",
    fix: "Go up a band and down a cup — 34D becomes 36C.",
  },
  {
    sign: "Your breast spills over the top or the side",
    meaning: "The cup is too small.",
    fix: "Keep the band, go up one cup letter.",
  },
  {
    sign: "The cup wrinkles or gapes at the top",
    meaning: "The cup is too large.",
    fix: "Keep the band, go down one cup letter.",
  },
  {
    sign: "The straps carry the weight, or slip off",
    meaning: "The band is doing too little.",
    fix: "The band should carry most of the support. Try a band size down.",
  },
  {
    sign: "The centre panel does not sit flat against you",
    meaning: "The cup is too small, or the shape is wrong for you.",
    fix: "Try a cup up first; if it still lifts away, try a different style.",
  },
]

/* ------------------------------------------------------------------ page */

export default async function BraSizeCalculatorPage() {
  const { products, sizesByProduct, region, braCategoryPath } =
    await loadBraSizeCatalog()

  // Resolved from the blog index rather than hardcoded, so a renamed or removed
  // post drops out of the list instead of becoming a 404 in the footer of the
  // page that is meant to be the hub for these queries.
  const RELATED_SLUGS = [
    "how-to-measure-bra-size-at-home",
    "bra-size-chart-pakistan",
    "bra-size-calculator-pakistan",
  ]
  const postsBySlug = new Map(getAllPosts().map((p) => [p.slug, p]))
  const relatedPosts = RELATED_SLUGS.map((slug) => postsBySlug.get(slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  )

  const bandRows = bandChartRows()
  const cupRows = cupChartRows()

  /** Sizes with at least one bra behind them, for the availability table. */
  const stockedLabels = new Set(
    Object.values(sizesByProduct).flat()
  )

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${CANONICAL}#calculator`,
        name: "Bra Size Calculator",
        url: CANONICAL,
        applicationCategory: "UtilitiesApplication",
        // It runs in the page. Saying so is what distinguishes a tool from an
        // article about a tool.
        browserRequirements: "Requires JavaScript",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: BRAND.currency },
        publisher: { "@id": ORG_ID },
        inLanguage: "en-PK",
        featureList: [
          "Band and cup size from underbust and bust measurements",
          "Inches and centimetres",
          "Sister size suggestions",
          "Available bras in the calculated size",
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${CANONICAL}#howto`,
        name: "How to measure your bra size at home",
        description:
          "Measure your underbust and bust with a soft tape to find your band and cup size.",
        totalTime: "PT5M",
        tool: [{ "@type": "HowToTool", name: "Soft tape measure" }],
        step: STEPS.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
          url: `${CANONICAL}#how-to-measure`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${CANONICAL}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Bra Size Calculator",
            item: CANONICAL,
          },
        ],
      },
    ],
  }

  return (
    <div className="content-container py-10 small:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------------------------ head */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-luxe text-ink/50"
      >
        <LocalizedClientLink href="/" className="hover:text-ink">
          Home
        </LocalizedClientLink>
        <span aria-hidden="true">/</span>
        <span className="text-ink/70">Bra Size Calculator</span>
      </nav>

      <div className="mb-9 max-w-2xl">
        <h1 className="font-display text-4xl text-ink small:text-5xl">
          Bra Size Calculator
        </h1>
        {/* The lead answers the query in the first sentence, so an answer
            engine quoting one line quotes something useful. */}
        <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
          Find your bra size from two measurements: your underbust and your bust.
          Enter them in inches or centimetres and this calculator gives you a
          band size, a cup size, your sister sizes, and the bras Raks actually
          lists in that size.
        </p>
      </div>

      <BraSizeCalculator
        products={products}
        sizesByProduct={sizesByProduct}
        region={region}
        braCategoryPath={braCategoryPath}
      />

      {/* --------------------------------------------------- how to measure */}
      <section id="how-to-measure" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-2xl text-ink small:text-3xl">
          How to measure your bra size at home
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink/70">
          You need a soft tape measure and a mirror. It takes about five minutes.
        </p>
        <ol className="mt-7 grid gap-6 small:grid-cols-2">
          {STEPS.map((step, i) => (
            <li key={step.name} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold text-[13px] text-gold-deep"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-[15px] font-medium text-ink">{step.name}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink/65">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------- size chart */}
      <section id="bra-size-chart" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-2xl text-ink small:text-3xl">
          Bra size chart
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink/70">
          The same two steps the calculator runs, written out. Your underbust
          gives the band; the difference between your bust and that band gives
          the cup.
        </p>

        <div className="mt-7 grid gap-10 small:grid-cols-2">
          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
              Band size
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-[14px]">
                <caption className="sr-only">
                  Underbust measurement in inches and centimetres, and the bra
                  band size it gives
                </caption>
                <thead>
                  <tr className="border-b border-bronze-100 text-left text-[12px] uppercase tracking-[0.12em] text-ink/55">
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Underbust (in)
                    </th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Underbust (cm)
                    </th>
                    <th scope="col" className="py-2.5 font-medium">
                      Band
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bandRows.map((row) => (
                    <tr key={row.band} className="border-b border-bronze-100">
                      <td className="py-2.5 pr-4 text-ink/75">
                        {row.underbustIn}
                      </td>
                      <td className="py-2.5 pr-4 text-ink/75">
                        {row.underbustCm}
                      </td>
                      <td className="py-2.5 font-medium text-ink">{row.band}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
              Cup size
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-[14px]">
                <caption className="sr-only">
                  Difference between bust and band measurement, and the cup size
                  it gives
                </caption>
                <thead>
                  <tr className="border-b border-bronze-100 text-left text-[12px] uppercase tracking-[0.12em] text-ink/55">
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Bust minus band (in)
                    </th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      (cm)
                    </th>
                    <th scope="col" className="py-2.5 font-medium">
                      Cup
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cupRows.map((row) => (
                    <tr key={row.cup} className="border-b border-bronze-100">
                      <td className="py-2.5 pr-4 text-ink/75">
                        {row.difference}
                      </td>
                      <td className="py-2.5 pr-4 text-ink/75">
                        {row.differenceCm}
                      </td>
                      <td className="py-2.5 font-medium text-ink">
                        {row.cup}
                        {!row.stocked && (
                          <span className="ml-2 text-[11px] font-normal text-ink/40">
                            not stocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink/55">
              One inch of difference is one cup letter, and one inch is{" "}
              {CM_PER_INCH} cm. Raks lists cups {STOCKED_CUPS.join(", ")} —
              note that DD sits between D and E, which is the UK ladder these
              brands are labelled on.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- sister sizes */}
      <section id="sister-sizes" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-2xl text-ink small:text-3xl">
          Sister size chart
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink/70">
          A sister size is a different band with a cup that holds about the same
          amount. If the cup is right but the band is not, these are what to try
          — and they are how to shop when your exact size is not made in the
          style you want.
        </p>
        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[14px]">
            <caption className="sr-only">
              Sister sizes for each band and cup Raks lists
            </caption>
            <thead>
              <tr className="border-b border-bronze-100 text-left text-[12px] uppercase tracking-[0.12em] text-ink/55">
                <th scope="col" className="py-2.5 pr-4 font-medium">
                  Your size
                </th>
                <th scope="col" className="py-2.5 pr-4 font-medium">
                  Band too loose — try
                </th>
                <th scope="col" className="py-2.5 font-medium">
                  Band too tight — try
                </th>
              </tr>
            </thead>
            <tbody>
              {STOCKED_BANDS.flatMap((band) =>
                ["B", "C", "D"].map((cup) => {
                  const run = sisterSizeRun(band, cup, 1)
                  const down = run.find((s) => s.band < band)
                  const up = run.find((s) => s.band > band)
                  const label = `${band}${cup}`
                  return (
                    <tr key={label} className="border-b border-bronze-100">
                      <th
                        scope="row"
                        className="py-2.5 pr-4 text-left font-medium text-ink"
                      >
                        {label}
                        {!stockedLabels.has(label) && (
                          <span className="ml-2 text-[11px] font-normal text-ink/40">
                            not stocked
                          </span>
                        )}
                      </th>
                      <td className="py-2.5 pr-4 text-ink/75">
                        {down?.label ?? "—"}
                      </td>
                      <td className="py-2.5 text-ink/75">{up?.label ?? "—"}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-ink/55">
          Shown for the B, C and D cups Raks stocks most widely. The rule is the
          same for any cup: one band down means one cup up, one band up means one
          cup down.
        </p>
      </section>

      {/* -------------------------------------------------------- fit check */}
      <section id="fit-check" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-2xl text-ink small:text-3xl">
          Signs your bra is the wrong size
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-ink/70">
          A tape measure gets you close. The mirror confirms it. Check these
          after the bra is on and settled, with the straps adjusted.
        </p>
        <ul className="mt-7 grid gap-5 small:grid-cols-2">
          {FIT_CHECKS.map((c) => (
            <li key={c.sign} className="border border-cream-200 bg-[#fffdf9] p-5">
              <h3 className="text-[15px] font-medium text-ink">{c.sign}</h3>
              <p className="mt-1.5 text-[13.5px] text-ink/60">{c.meaning}</p>
              <p className="mt-2 text-[13.5px] text-ink/75">{c.fix}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------- note */}
      <section className="mt-16 max-w-2xl border-l-2 border-gold pl-5">
        <h2 className="font-display text-xl text-ink">
          How accurate is this calculator?
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/70">
          The maths is exact: the same two measurements always give the same band
          and cup, and this page, the chart above and the size filters on the
          shop all run off one calculation. What a tape measure cannot capture is
          breast shape, or how a particular style is cut — two bras in the same
          size from different brands will not fit identically.
        </p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/70">
          So treat your result as the size to try first. If the band is right and
          the cup is not, move a cup letter. If the cup is right and the band is
          not, move to a sister size. Raks exchanges unworn items with tags on
          within {POLICY.exchangeWindowDays} days.
        </p>
      </section>

      <FaqSection faqs={FAQS} className="mt-16 max-w-3xl" />

      {/* Links out to the three older sizing posts.
          They rank for the same family of queries, so leaving this page with no
          route to them makes four pages compete instead of one hub pointing at
          three. Note that two of them carry a sizing chart that disagrees with
          this calculator — OWNER-26 in the AEO todo has the numbers and the
          decision that needs making. */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl text-ink">Read more on fit</h2>
          <ul className="mt-5 border-t border-bronze-100">
            {relatedPosts.map((post) => (
              <li key={post.slug} className="border-b border-bronze-100">
                <LocalizedClientLink
                  href={`/${post.slug}/`}
                  className="block py-4 text-[15px] text-ink transition-colors hover:text-accent"
                >
                  {post.title}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
