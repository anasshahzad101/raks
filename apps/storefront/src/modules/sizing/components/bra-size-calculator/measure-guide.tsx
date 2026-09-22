/**
 * The two measurements as two tape loops, with whichever one is being typed lit.
 *
 * The measuring steps used to be four paragraphs, and "directly under the bust,
 * where the band sits" is the kind of sentence that is only clear to someone who
 * already knows. The figure is driven by whichever input has focus, so the
 * picture answers the question at the moment it is being asked.
 *
 * Deliberately a diagram and not a body. Earlier versions drew a torso and then
 * a dress form, and both read as a gourd at 150px wide — a figure needs more
 * space and more line weight than this slot has before it stops looking like a
 * mistake. Two loops, the wider one above, say the one thing that matters here:
 * these are two different measurements, taken at two heights, and the lower one
 * is the smaller.
 *
 * Decorative in the accessibility sense — the same instruction is in the visible
 * label and help text under each field, so the SVG is hidden from screen readers
 * rather than repeating it worse.
 */

const GUIDE = "#e2d2bb"
const OFF = "#bb8a45"
const ON = "#6d1430"

export default function MeasureGuide({
  active,
}: {
  active: "underbust" | "bust" | null
}) {
  const lit = (which: "underbust" | "bust") =>
    active === which
      ? { stroke: ON, width: 2.2, dash: "0", opacity: 1, weight: 600 }
      : { stroke: OFF, width: 1.4, dash: "4 3.5", opacity: 0.5, weight: 400 }

  const bust = lit("bust")
  const under = lit("underbust")

  return (
    <svg
      viewBox="0 0 200 152"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full"
    >
      {/* Faint body between the two loops, so they read as two heights on one
          torso rather than two unrelated rings. */}
      <path
        d="M30 44c-2 22 4 40 10 58M130 44c2 22-4 40-10 58"
        fill="none"
        stroke={GUIDE}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Bust — the fullest part, so the wider loop and the higher one. */}
      <g opacity={bust.opacity} style={{ transition: "opacity 200ms" }}>
        <ellipse
          cx="80"
          cy="44"
          rx="50"
          ry="15"
          fill="none"
          stroke={bust.stroke}
          strokeWidth={bust.width}
          strokeDasharray={bust.dash}
        />
        <path
          d="M132 47h12"
          fill="none"
          stroke={bust.stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <text
          x="148"
          y="50"
          fontSize="9.5"
          letterSpacing="1.2"
          fontWeight={bust.weight}
          fill={bust.stroke}
        >
          BUST
        </text>
      </g>

      {/* Underbust — where the band sits, so the narrower loop below. */}
      <g opacity={under.opacity} style={{ transition: "opacity 200ms" }}>
        <ellipse
          cx="80"
          cy="104"
          rx="41"
          ry="13"
          fill="none"
          stroke={under.stroke}
          strokeWidth={under.width}
          strokeDasharray={under.dash}
        />
        <path
          d="M123 107h21"
          fill="none"
          stroke={under.stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <text
          x="148"
          y="104"
          fontSize="9.5"
          letterSpacing="1.2"
          fontWeight={under.weight}
          fill={under.stroke}
        >
          UNDER
        </text>
        <text
          x="148"
          y="116"
          fontSize="9.5"
          letterSpacing="1.2"
          fontWeight={under.weight}
          fill={under.stroke}
        >
          BUST
        </text>
      </g>
    </svg>
  )
}
