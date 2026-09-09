/**
 * Turn migrated WordPress HTML into plain text fit for meta descriptions and
 * JSON-LD.
 *
 * Stripping tags alone is not enough: the source content is full of character
 * entities, and an "&amp;" left in a meta description or a schema.org string is
 * read literally by consumers rather than as "&". Tags come out first, then
 * entities, so an escaped "&lt;b&gt;" cannot turn back into a live tag.
 */

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
}

const decodeEntities = (s: string) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match
    }
    return ENTITIES[body.toLowerCase()] ?? match
  })

export const toPlainText = (html?: string | null): string =>
  decodeEntities(String(html ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
