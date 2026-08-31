import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import { HttpTypes } from "@medusajs/types"

/**
 * The sign-in prompt was removed with the Medusa backend: customer accounts
 * cannot be created or read without it, so offering sign-in led nowhere.
 */
const CartTemplate = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_380px] gap-x-12 small:gap-x-16">
            <div className="flex flex-col py-6 gap-y-6">
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && <Summary cart={cart} />}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
