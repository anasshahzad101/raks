"use client"

import { useEffect, useState } from "react"

import { PlacedOrder, readLastOrder } from "@lib/last-order"
import { convertToLocale } from "@lib/util/money"
import { Purchase } from "@modules/analytics/ecommerce-events"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * Confirmation for an emailed order.
 *
 * The order exists only as an email, so there is nothing to fetch back: the
 * checkout hands it over through sessionStorage. Every figure shown — and every
 * figure reported to Analytics — is the server's own response, not the cart the
 * browser was holding.
 *
 * Landing here without a stored order (a refresh in a new session, a shared
 * link) shows a neutral message rather than a broken page, and reports nothing.
 */
export default function EmailOrderConfirmation() {
  const [order, setOrder] = useState<PlacedOrder | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setOrder(readLastOrder())
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="content-container py-24">
        <div className="mx-auto h-64 max-w-2xl animate-pulse bg-cream-200/50" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="content-container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="font-display text-[32px] font-medium leading-none text-ink">
          Thank you
        </h1>
        <p className="max-w-[420px] text-[14px] font-light leading-[1.7] text-ink/60">
          If you have just placed an order, we have received it and will call to
          confirm. Your order details were shown once and are not stored in this
          browser.
        </p>
        <LocalizedClientLink href="/shop">
          <Button className="h-[52px] px-10 tracking-[0.16em]">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    )
  }

  const currency = order.currency

  return (
    <div className="content-container py-14 small:py-20">
      <Purchase
        transactionId={order.reference}
        items={order.items.map((item, index) => ({
          item_id: item.handle,
          item_name: item.product_title,
          item_brand: "Raks",
          item_variant: item.variant_title || undefined,
          price: item.unit_price,
          quantity: item.quantity,
          index,
        }))}
        value={order.total}
        currency={currency.toUpperCase()}
        shipping={order.shipping}
      />

      <div className="mx-auto max-w-2xl border border-cream-300 bg-[#fffdf9] p-8 small:p-12">
        <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-gold">
          Order received
        </div>
        <h1 className="mb-3 font-display text-[34px] font-medium leading-none text-ink small:text-[40px]">
          Thank you!
        </h1>
        <p className="mb-8 text-[14.5px] font-light leading-[1.75] text-ink/65">
          Your order <strong className="font-medium text-ink">
            {order.reference}
          </strong>{" "}
          has reached us. We will call to confirm your delivery details, and you
          pay in cash when it arrives.
        </p>

        <div className="border-t border-cream-300 pt-6">
          {order.items.map((item) => (
            <div
              key={`${item.handle}-${item.variant_title}`}
              className="flex items-start justify-between gap-4 border-b border-cream-200 py-3.5"
            >
              <div>
                <p className="text-[14.5px] font-medium text-ink">
                  {item.product_title}
                </p>
                {item.variant_title && (
                  <p className="text-[13px] text-ink/55">
                    {item.variant_title}
                  </p>
                )}
                <p className="text-[13px] text-ink/55">
                  Qty {item.quantity} ·{" "}
                  {convertToLocale({
                    amount: item.unit_price,
                    currency_code: currency,
                  })}
                </p>
              </div>
              <p className="whitespace-nowrap text-[14.5px] text-ink">
                {convertToLocale({
                  amount: item.unit_price * item.quantity,
                  currency_code: currency,
                })}
              </p>
            </div>
          ))}

          <div className="flex justify-between py-2 pt-4 text-[14px] text-ink/65">
            <span>Subtotal</span>
            <span>
              {convertToLocale({
                amount: order.subtotal,
                currency_code: currency,
              })}
            </span>
          </div>
          <div className="flex justify-between py-2 text-[14px] text-ink/65">
            <span>Delivery</span>
            <span>
              {order.shipping
                ? convertToLocale({
                    amount: order.shipping,
                    currency_code: currency,
                  })
                : "Free"}
            </span>
          </div>
          <div className="flex justify-between border-t border-cream-300 py-4 text-[17px] font-medium text-ink">
            <span>Total</span>
            <span>
              {convertToLocale({
                amount: order.total,
                currency_code: currency,
              })}
            </span>
          </div>
        </div>

        <LocalizedClientLink href="/shop">
          <Button className="mt-4 h-[52px] w-full tracking-[0.16em]">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
