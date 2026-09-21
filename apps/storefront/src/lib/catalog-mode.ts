/**
 * Which catalogue the storefront reads from.
 *
 * Two modules need this answer and must never disagree: `lib/config.ts` decides
 * where product reads go, and `lib/resolve-variant.ts` decides where order
 * prices come from. Split between them, a mismatch would show customers live
 * prices while charging snapshot ones — so the flag is resolved once, here.
 *
 * Still defaults to ON, for the reason the original comment gave: if the host's
 * build environment lacks the variable, every catalog read would otherwise fall
 * through to an absent backend and silently empty the catalogue.
 *
 * What changed is how the opt-out is matched. It was compared to the exact
 * string "false", so `False`, `FALSE` or a value with a stray space read as
 * "keep the snapshot" and the site stayed on stale data with nothing in the
 * build log to say why. Case and surrounding whitespace are now ignored.
 *
 * The `process.env.NEXT_PUBLIC_*` reference stays literal on purpose: Next
 * inlines these at build time by textual substitution, and a computed lookup
 * like process.env[name] would not be replaced.
 */
const raw = process.env.NEXT_PUBLIC_USE_CATALOG_SNAPSHOT

export const USE_CATALOG_SNAPSHOT =
  String(raw ?? "")
    .trim()
    .toLowerCase() !== "false"
