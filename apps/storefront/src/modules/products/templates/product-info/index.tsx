import { HttpTypes } from "@medusajs/types"
import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

// Prefer the most specific category for the eyebrow (skip the "Lingerie" /
// "Nightdress" roots when a shopping subcategory exists).
const specificCategory = (product: HttpTypes.StoreProduct) => {
  const cats = product.categories ?? []
  return (
    cats.find((c) => !/^(lingerie|nightdress)$/i.test(c.name ?? "")) ?? cats[0]
  )
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const category = specificCategory(product)
  const eyebrow = product.collection?.title ?? category?.name ?? "RAKS"
  const eyebrowHref = product.collection
    ? `/collections/${product.collection.handle}`
    : category
    ? `/product-category/${category.handle}/`
    : undefined

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-3.5">
        {eyebrowHref ? (
          <LocalizedClientLink
            href={eyebrowHref}
            className="text-[11.5px] uppercase tracking-[0.2em] text-gold hover:text-accent transition-colors"
          >
            {eyebrow}
          </LocalizedClientLink>
        ) : (
          <span className="text-[11.5px] uppercase tracking-[0.2em] text-gold">
            {eyebrow}
          </span>
        )}
        <Heading
          level="h1"
          className="font-display font-medium text-[34px] leading-[1.12] text-ink small:text-[40px]"
          data-testid="product-title"
        >
          {product.title}
        </Heading>
      </div>
    </div>
  )
}

export default ProductInfo
