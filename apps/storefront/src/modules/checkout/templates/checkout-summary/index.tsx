import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <div className="sticky top-6 flex flex-col-reverse small:flex-col gap-y-8 border border-cream-300 bg-[#fffdf9] p-7 py-8 small:py-8">
      <div className="w-full flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="font-display font-medium text-[24px] leading-none text-ink"
        >
          In your bag
        </Heading>
        <Divider className="my-6" />
        <CartTotals totals={cart} />
        <ItemsPreviewTemplate cart={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
