import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="flex flex-col items-center justify-center py-32 text-center small:py-44"
      data-testid="empty-cart-message"
    >
      <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold">
        Your bag
      </div>
      <h1 className="mb-4 font-display text-[40px] font-medium leading-none text-ink small:text-[48px]">
        Your bag is empty
      </h1>
      <p className="mb-8 max-w-[32rem] text-[15px] font-light leading-[1.7] text-[#5c4d42]">
        Nothing here yet. Explore our lingerie, nightwear and shapewear — soft,
        premium pieces made to be lived in.
      </p>
      <LocalizedClientLink
        href="/shop/"
        className="bg-accent px-9 py-4 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream-50 transition-colors hover:bg-burgundy-dark"
      >
        Start shopping
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
