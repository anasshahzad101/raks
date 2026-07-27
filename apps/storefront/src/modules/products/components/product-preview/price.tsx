import { Text, clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <>
      <Text
        className={clx("text-[15px] font-medium text-accent", {
          "": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {price.price_type === "sale" && (
        <Text
          className="line-through text-ink/35 text-[13px]"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
    </>
  )
}
