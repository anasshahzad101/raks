import { listCategories, categoryPath } from "@lib/data/categories"
import { getCategoryProductCount } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

/**
 * The category-page sidebar's CATEGORY list: the main shopping categories
 * (the children of the "Lingerie" root — same set as the top nav) with a live
 * product count each, plus an "All" row. The branch containing the current
 * category is highlighted. Server component — degrades to nothing if the
 * backend is unavailable.
 */

const ORDER = ["nightwear", "bras", "pyjama", "shapewear", "panties"]

export default async function CategoryNav({
  activeCategory,
}: {
  activeCategory: HttpTypes.StoreProductCategory
}) {
  const categories = await listCategories().catch(() => [])
  if (!categories?.length) return null

  const roots = categories.filter(
    (c: any) => !c.parent_category && !c.parent_category_id
  )
  const root = roots.find((c) => c.handle === "lingerie") ?? roots[0]
  if (!root) return null

  const mains = categories
    .filter((c: any) => (c.parent_category?.id ?? c.parent_category_id) === root.id)
    .sort(
      (a, b) =>
        (ORDER.indexOf(a.handle!) + 1 || 99) - (ORDER.indexOf(b.handle!) + 1 || 99)
    )

  // The chain of ids from the active category up to the root — used to mark the
  // active main branch (e.g. viewing "Padded Bra" highlights "Bras").
  const activeChain = new Set<string>()
  let cur: any = activeCategory
  while (cur) {
    activeChain.add(cur.id)
    cur = cur.parent_category
  }

  const [allCount, ...counts] = await Promise.all([
    getCategoryProductCount(),
    ...mains.map((m) => getCategoryProductCount(m.id)),
  ])

  const rowBase =
    "flex items-center justify-between text-[13.5px] transition-colors"

  return (
    <div>
      {/* A filter label, not a document section. As an <h2> it sat directly
          under the page <h1> and every product title nested beneath it, so the
          heading outline read "Padded Bra in Pakistan > Category > <product>".
          It keeps its accessible name via aria-labelledby on the list. */}
      <p
        id="category-filter-label"
        className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
      >
        Category
      </p>
      <ul
        aria-labelledby="category-filter-label"
        className="flex flex-col gap-y-[13px]"
      >
        <li>
          <LocalizedClientLink
            href="/shop/"
            className={`${rowBase} text-ink/70 hover:text-accent`}
          >
            <span>All</span>
            <span className="text-ink/35">{allCount}</span>
          </LocalizedClientLink>
        </li>
        {mains.map((m, i) => {
          const active = activeChain.has(m.id)
          return (
            <li key={m.id}>
              <LocalizedClientLink
                href={categoryPath(m)}
                className={`${rowBase} ${
                  active
                    ? "font-semibold text-accent"
                    : "text-ink/70 hover:text-accent"
                }`}
              >
                <span>{m.name}</span>
                <span className={active ? "text-accent/70" : "text-ink/35"}>
                  {counts[i]}
                </span>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
