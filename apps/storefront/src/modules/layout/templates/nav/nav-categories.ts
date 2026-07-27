import { listCategories } from "@lib/data/categories"

export type NavCategory = {
  name: string
  href: string
  children: { name: string; href: string }[]
}

/**
 * Build the main navigation from the Medusa category tree.
 * Raks nests everything under a single "Lingerie" root, so the useful
 * shopping categories are that root's children (Nightwear, Bras, Pyjama, …),
 * each with its own sub-categories as a dropdown.
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  const categories = await listCategories().catch(() => [])
  if (!categories?.length) return []

  const byId = new Map(categories.map((c) => [c.id, c]))

  // path helper from parent chain
  const pathOf = (cat: any): string => {
    const slugs: string[] = []
    let cur: any = cat
    while (cur) {
      if (cur.handle) slugs.unshift(cur.handle)
      cur = cur.parent_category ?? (cur.parent_category_id ? byId.get(cur.parent_category_id) : null)
    }
    return `/product-category/${slugs.join("/")}/`
  }

  // find the root (no parent) — "lingerie"
  const roots = categories.filter((c: any) => !c.parent_category && !c.parent_category_id)
  const root = roots.find((c) => c.handle === "lingerie") ?? roots[0]
  if (!root) return []

  const mains = categories.filter(
    (c: any) =>
      (c.parent_category?.id ?? c.parent_category_id) === root.id
  )

  // preferred order for the main menu
  const order = ["nightwear", "bras", "pyjama", "shapewear", "panties"]
  mains.sort(
    (a, b) =>
      (order.indexOf(a.handle!) + 1 || 99) - (order.indexOf(b.handle!) + 1 || 99)
  )

  return mains.map((m: any) => {
    const children = categories
      .filter((c: any) => (c.parent_category?.id ?? c.parent_category_id) === m.id)
      .map((c: any) => ({ name: c.name, href: pathOf(c) }))
    return { name: m.name, href: pathOf(m), children }
  })
}
