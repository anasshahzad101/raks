/**
 * Renders migrated WordPress/blog HTML with elegant Raks prose styling.
 * The `raks-prose` class is styled in globals.css.
 */
export default function ArticleBody({ html }: { html: string }) {
  return (
    <div className="content-container max-w-3xl">
      <div
        className="raks-prose mt-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
