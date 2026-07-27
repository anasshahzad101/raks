/**
 * Renders product/category copy that may be either plain text or HTML
 * (a lot of the migrated WooCommerce + AI-generated content is raw HTML).
 *
 * - If the string contains HTML tags it is rendered as markup with the shared
 *   `raks-prose` styling (see globals.css), after stripping the noisy
 *   `data-start` / `data-end` editor attributes that leak in from pasted content.
 * - Otherwise it falls back to plain text with preserved line breaks.
 */

import { plainTextToHtml } from "@lib/util/format-description"

const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/i

const stripEditorNoise = (html: string) =>
  html
    // remove data-start="…" / data-end="…" attributes left by editors
    .replace(/\s+data-(?:start|end)="[^"]*"/gi, "")
    // collapse empty paragraphs
    .replace(/<p>\s*<\/p>/gi, "")

type RichTextProps = {
  content?: string | null
  className?: string
  "data-testid"?: string
}

const RichText = ({
  content,
  className = "",
  "data-testid": dataTestId,
}: RichTextProps) => {
  if (!content) {
    return null
  }

  const looksLikeHtml = HTML_TAG_RE.test(content)

  if (looksLikeHtml) {
    return (
      <div
        className={`raks-prose ${className}`}
        data-testid={dataTestId}
        dangerouslySetInnerHTML={{ __html: stripEditorNoise(content) }}
      />
    )
  }

  return (
    <div
      className={`raks-prose ${className}`}
      data-testid={dataTestId}
      dangerouslySetInnerHTML={{ __html: plainTextToHtml(content) }}
    />
  )
}

export default RichText
