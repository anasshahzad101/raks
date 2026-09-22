import { ReactNode } from "react"

/**
 * Marker a post's HTML can carry to have a real component rendered in its place.
 *
 * `/bra-size-calculator-pakistan/` used to ship a calculator as a `<div>` plus
 * an inline `<script>` inside its migrated WordPress content. That widget's band
 * formula divided centimetres by two and returned sizes about two steps too
 * large, and being hand-written HTML it could not be fixed by fixing the real
 * calculator. The markup is replaced by this marker and the actual component
 * renders in the gap, so there is one implementation of the maths on the site.
 */
export const WIDGET_MARKER = '<div data-raks-widget="bra-size-calculator"></div>'

/**
 * Renders migrated WordPress/blog HTML with elegant Raks prose styling.
 * The `raks-prose` class is styled in globals.css.
 *
 * When `embed` is given and the HTML carries WIDGET_MARKER, the content is split
 * at the marker and `embed` renders between the halves. Splitting rather than
 * hydrating in place keeps the rest of the post as plain `dangerouslySetInnerHTML`
 * — the marker is a literal string in the JSON, so there is no HTML parsing here.
 */
export default function ArticleBody({
  html,
  embed,
}: {
  html: string
  embed?: ReactNode
}) {
  const parts = embed && html.includes(WIDGET_MARKER)
    ? html.split(WIDGET_MARKER)
    : null

  return (
    <div className="content-container max-w-3xl">
      {parts ? (
        <div className="raks-prose mt-10">
          <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
          {/* Outside raks-prose's typography rules would be cleaner, but the
              calculator brings its own styling and the wrapper only sets prose
              defaults it overrides anyway. */}
          <div className="not-prose my-10">{embed}</div>
          <div dangerouslySetInnerHTML={{ __html: parts.slice(1).join("") }} />
        </div>
      ) : (
        <div
          className="raks-prose mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}
