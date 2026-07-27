import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function FeaturedRail({
  title = "Bestsellers",
  eyebrow = "Loved by Pakistan",
  limit = 8,
  order = "-created_at",
}: {
  title?: string
  eyebrow?: string
  subtitle?: string
  limit?: number
  order?: string
}) {
  const region = await getRegion("pk")
  if (!region) return null

  const { response } = await listProducts({
    countryCode: "pk",
    queryParams: { limit, order } as any,
  })

  const products = response.products
  if (!products?.length) return null

  return (
    <section className="content-container pt-[84px]">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-3">
            {eyebrow}
          </div>
          <h2 className="font-display font-medium text-[42px] text-ink m-0">{title}</h2>
        </div>
        <LocalizedClientLink
          href="/shop/"
          className="text-xs tracking-[0.16em] uppercase text-accent border-b border-accent pb-1 hover:text-gold transition-colors"
        >
          View all
        </LocalizedClientLink>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-9">
        {products.map((p) => (
          <ProductPreview key={p.id} product={p} region={region} />
        ))}
      </div>
    </section>
  )
}
