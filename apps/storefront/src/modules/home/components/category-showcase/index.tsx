import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ORDER = ["nightwear", "bras", "pyjama", "shapewear", "panties"]

// Fallback gradients per tile index (burgundy / wine / gold tones)
const GRADS = [
  "linear-gradient(135deg,#7a1d3a,#4a0e1f)",
  "linear-gradient(135deg,#8a5a2a,#5a3418)",
  "linear-gradient(135deg,#6d1430,#3a2030)",
  "linear-gradient(135deg,#9a6f34,#5a3d1a)",
  "linear-gradient(135deg,#5a2438,#2a1117)",
  "linear-gradient(135deg,#7a4a52,#4a0e1f)",
]

export default async function CategoryShowcase() {
  const categories = await listCategories().catch(() => [])
  if (!categories?.length) return null

  const byId = new Map(categories.map((c: any) => [c.id, c]))
  const pathOf = (cat: any): string => {
    const slugs: string[] = []
    let cur: any = cat
    while (cur) {
      if (cur.handle) slugs.unshift(cur.handle)
      cur = cur.parent_category ?? (cur.parent_category_id ? byId.get(cur.parent_category_id) : null)
    }
    return `/product-category/${slugs.join("/")}/`
  }

  const root = categories.find((c: any) => c.handle === "lingerie")
  const mains = categories
    .filter((c: any) => (c.parent_category?.id ?? c.parent_category_id) === root?.id)
    .sort(
      (a: any, b: any) =>
        (ORDER.indexOf(a.handle) + 1 || 99) - (ORDER.indexOf(b.handle) + 1 || 99)
    )
    .slice(0, 6)

  const tiles = await Promise.all(
    mains.map(async (m: any, i: number) => {
      let image: string | undefined
      let count = 0
      try {
        const { response } = await listProducts({
          countryCode: "pk",
          queryParams: { category_id: m.id, limit: 1, fields: "thumbnail" } as any,
        })
        image = response.products?.[0]?.thumbnail ?? undefined
        count = response.count ?? 0
      } catch {}
      return { name: m.name, href: pathOf(m), image, count, grad: GRADS[i % GRADS.length] }
    })
  )

  return (
    <section className="content-container pt-[84px] pb-5">
      <div className="text-center mb-[46px]">
        <div className="text-xs tracking-[0.3em] uppercase text-gold mb-3.5">
          Shop by Category
        </div>
        <h2 className="font-display font-medium text-[42px] text-ink m-0">Find your fit</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-[22px]">
        {tiles.map((t) => (
          <LocalizedClientLink
            key={t.href}
            href={t.href}
            className="group relative block aspect-[4/3] overflow-hidden text-left"
          >
            <div className="absolute inset-0" style={{ background: t.grad }}>
              {t.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.06]"
                />
              )}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.42),rgba(0,0,0,0.05)_55%)]" />
            <div className="absolute left-[26px] bottom-6 right-[26px]">
              <div className="font-display text-[30px] text-white leading-[1.05]">
                {t.name}
              </div>
              <div className="text-[11.5px] tracking-[0.1em] text-white/80 mt-1.5 flex items-center gap-2">
                {t.count > 0 ? `${t.count} styles` : "Explore"}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
