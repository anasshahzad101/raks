import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { BRAND, absoluteUrl } from "@lib/raks"

export const metadata: Metadata = {
  title: { absolute: `Shop All Lingerie & Nightwear | ${BRAND.name}` },
  description:
    "Browse the full Raks collection — bras, nightwear, pyjamas, shapewear and panties. Premium comfort, delivered across Pakistan with cash on delivery.",
  alternates: { canonical: absoluteUrl("/shop/") },
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export default async function StorePage(props: Params) {
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams

  return <StoreTemplate sortBy={sortBy} page={page} countryCode="pk" />
}
