import { Metadata } from "next"

import { SITE_URL } from "@lib/raks"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import ShoppingAssistant from "@modules/assistant/shopping-assistant"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
}

/**
 * The cart-mismatch banner and free-shipping nudge used to render here, which
 * meant every page awaited `retrieveCart()` and `listCartOptions()` against a
 * Medusa backend that is not deployed — a guaranteed failed round trip on each
 * request. The bag now lives in the browser (`lib/local-cart.ts`), so nothing
 * in the layout needs cart data. Both components remain on disk for whenever
 * the backend comes back.
 */
export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {props.children}
      <Footer />
      {/* Guided shopping assistant. Its catalogue index is fetched only when a
          shopper opens it, so it adds nothing to page weight otherwise. */}
      <ShoppingAssistant />
    </>
  )
}
