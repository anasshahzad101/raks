"use client"

import { useMemo, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import RichText from "@modules/common/components/rich-text"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import Back from "@modules/common/icons/back"
import ProductReviews from "./reviews"

type ProductDetailTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductDetailTabs = ({ product }: ProductDetailTabsProps) => {
  const tabs = useMemo(() => {
    const t: { key: string; label: string; content: React.ReactNode }[] = []

    if (product.description) {
      t.push({
        key: "details",
        label: "Details",
        content: (
          <RichText
            content={product.description}
            className="max-w-3xl"
            data-testid="product-description"
          />
        ),
      })
    }

    t.push({
      key: "info",
      label: "Product Information",
      content: <ProductInfoPanel product={product} />,
    })
    t.push({
      key: "shipping",
      label: "Shipping & Returns",
      content: <ShippingPanel />,
    })
    t.push({
      key: "reviews",
      label: "Reviews",
      content: <ProductReviews product={product} />,
    })

    return t
  }, [product])

  const [active, setActive] = useState(tabs[0]?.key)
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div className="mt-16 border-t border-bronze-100 pt-8 small:mt-24">
      {/* Tab bar (full width) */}
      <div className="flex flex-wrap gap-x-8 gap-y-1 border-b border-bronze-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={clx(
              "relative -mb-px pb-4 text-xs uppercase tracking-luxe transition-colors",
              active === t.key
                ? "text-ink"
                : "text-ink/40 hover:text-ink/70"
            )}
          >
            {t.label}
            {active === t.key && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />
            )}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="py-8 small:py-10">{activeTab?.content}</div>
    </div>
  )
}

const ProductInfoPanel = ({ product }: ProductDetailTabsProps) => {
  const rows = [
    { label: "Material", value: product.material },
    { label: "Country of origin", value: product.origin_country },
    { label: "Type", value: product.type?.value },
    { label: "Weight", value: product.weight ? `${product.weight} g` : null },
    {
      label: "Dimensions",
      value:
        product.length && product.width && product.height
          ? `${product.length}L x ${product.width}W x ${product.height}H`
          : null,
    },
  ]

  return (
    <dl className="grid grid-cols-1 gap-x-12 gap-y-4 small:grid-cols-2 max-w-3xl">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-bronze-100/70 py-2"
        >
          <dt className="text-sm font-medium text-ink">{row.label}</dt>
          <dd className="text-sm text-ink/60">{row.value || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

const ShippingPanel = () => {
  const items = [
    {
      icon: <FastDelivery />,
      title: "Fast delivery",
      body: "Your package will arrive in 3-5 business days at your pick up location or in the comfort of your home.",
    },
    {
      icon: <Refresh />,
      title: "Simple exchanges",
      body: "Is the fit not quite right? No worries — we'll exchange your product for a new one.",
    },
    {
      icon: <Back />,
      title: "Easy returns",
      body: "Just return your product and we'll refund your money. No questions asked — we'll do our best to make sure your return is hassle-free.",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-8 small:grid-cols-3 max-w-4xl">
      {items.map((item) => (
        <div key={item.title} className="flex flex-col gap-y-2">
          <span className="text-ink">{item.icon}</span>
          <span className="text-sm font-semibold text-ink">{item.title}</span>
          <p className="text-sm leading-relaxed text-ink/60">{item.body}</p>
        </div>
      ))}
    </div>
  )
}

export default ProductDetailTabs
