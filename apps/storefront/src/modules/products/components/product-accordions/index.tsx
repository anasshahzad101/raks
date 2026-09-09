import { HttpTypes } from "@medusajs/types"
import RichText from "@modules/common/components/rich-text"
import { extractComposition } from "@lib/util/composition"
import {
  POLICY,
  deliveryWindow,
  freeDeliveryThresholdLabel,
} from "@lib/raks"

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
  const composition = extractComposition(product.description)

  return (
    <div className="mt-8 border-t border-cream-300">
      {product.description && (
        <Row title="Description">
          <RichText content={product.description} className="raks-prose-compact" />
        </Row>
      )}

      {/* Fabric is read from this product's own description. The panel used to
          print "Made from soft, breathable fabrics chosen for all-day comfort"
          on all 207 products, which asserts a material property across a
          catalogue that includes 100% polyester, and contradicted the 31
          descriptions that state a real composition. Where none is stated, the
          panel says so rather than inventing one. */}
      <Row title="Fabric & Care">
        {composition ? (
          <p>
            <strong>Composition:</strong> {composition}.
          </p>
        ) : (
          <p>
            The fabric composition for this piece is not listed by the supplier.
            Email us if you need it before ordering and we will check.
          </p>
        )}
        <p className="mt-3">
          Hand wash cold with a mild detergent, avoid wringing or bleach, and dry
          flat in shade to keep the shape and finish looking their best.
        </p>
      </Row>

      {/* Delivery and exchange values come from POLICY so this panel cannot
          drift from the FAQ, the product page and llms.txt. */}
      <Row title="Shipping & Returns">
        <p>
          Free delivery across Pakistan on orders over{" "}
          {freeDeliveryThresholdLabel()}, shipped in {POLICY.packaging} and
          usually delivered within {deliveryWindow()}. Wrong fit? Exchange for a
          different size within {POLICY.exchangeWindowDays} days, unworn with
          tags intact.
        </p>
      </Row>
    </div>
  )
}

export default ProductAccordions
