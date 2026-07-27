import { HttpTypes } from "@medusajs/types"
import RichText from "@modules/common/components/rich-text"

/**
 * Product-page accordions (Description, Fabric & Care, Shipping & Returns) in
 * the reference style: uppercase titles, gold +/− signs, cream-300 dividers.
 * Native <details> — accessible and crawlable with no client JS. The full
 * migrated product HTML lives in the Description panel.
 */
const Row = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <details className="group border-b border-cream-300">
    <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[13px] font-medium uppercase tracking-[0.12em] text-ink">
      <span>{title}</span>
      <span className="text-lg leading-none text-gold transition-transform duration-200 group-open:rotate-45">
        +
      </span>
    </summary>
    <div className="pb-6 text-[14px] font-light leading-[1.75] text-[#5c4d42]">
      {children}
    </div>
  </details>
)

const ProductAccordions = ({ product }: { product: HttpTypes.StoreProduct }) => {
  return (
    <div className="mt-8 border-t border-cream-300">
      {product.description && (
        <Row title="Description">
          <RichText content={product.description} className="raks-prose-compact" />
        </Row>
      )}

      <Row title="Fabric & Care">
        <p>
          Made from soft, breathable fabrics chosen for all-day comfort. Hand
          wash cold with a mild detergent, avoid wringing or bleach, and dry flat
          in shade to keep the shape and finish looking their best.
        </p>
      </Row>

      <Row title="Shipping & Returns">
        <p>
          Free delivery across Pakistan on orders over Rs 3,000, shipped in plain,
          discreet packaging and usually delivered within 3–5 business days. Wrong
          fit? Exchange for a different size within 15 days, unworn with tags
          intact.
        </p>
      </Row>
    </div>
  )
}

export default ProductAccordions
