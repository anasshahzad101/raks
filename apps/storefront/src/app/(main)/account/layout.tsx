import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
// TODO: Re-add Toaster component when needed
import AccountLayout from "@modules/account/templates/account-layout"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Account pages are per-customer and read live data from Medusa, so they must
 * never be prerendered. This became load-bearing when the cart calls left the
 * parent layout: those read cookies, which made every page under (main)
 * implicitly dynamic. Without the cart, Next tries to prerender this segment at
 * build time and the build fails outright on the absent backend.
 */
export const dynamic = "force-dynamic"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}
