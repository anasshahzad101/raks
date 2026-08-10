"use client"

import { GA_MEASUREMENT_ID, trackPageView } from "@lib/analytics"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"

/**
 * Fires a page_view on every App Router navigation.
 *
 * gtag is configured with send_page_view:false below, because its automatic
 * page_view only fires on a full document load — client-side route changes
 * would otherwise be invisible and every session would look like one page.
 */
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The initial page_view is sent by the config call; skip it here to avoid
  // counting the landing page twice.
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const query = searchParams?.toString()
    trackPageView(query ? `${pathname}?${query}` : pathname)
  }, [pathname, searchParams])

  return null
}

/**
 * Loads gtag.js and keeps page_view in sync with client-side navigation.
 * Rendered once from the root layout.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: true,
            currency: 'PKR',
            country: 'PK'
          });
        `}
      </Script>
      {/* useSearchParams needs a Suspense boundary to avoid opting the whole
          tree into client-side rendering. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
