"use client"

import {
  META_PIXEL_ID,
  META_SCRIPT_URL,
  trackMetaPageView,
} from "@lib/meta-pixel"
import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * Fires PageView on the first render and on every App Router navigation.
 *
 * Unlike gtag, nothing sends the initial PageView for us: `fbq('init')` alone
 * reports no view, so this tracker owns every one of them.
 *
 * Keyed on the path only, not the query. A product page rewrites its own query
 * string as sizes are picked (`router.replace` in product-actions), so a
 * query-sensitive tracker reports two or three PageViews for one visit to one
 * product — inflating reach and traffic-campaign numbers. The guard also
 * absorbs re-renders and strict mode's double-invoked effect in development.
 */
function PageViewTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname

    trackMetaPageView()
  }, [pathname])

  return null
}

/**
 * Loads the Meta Pixel and keeps PageView in sync with client-side navigation.
 * Rendered once from the root layout.
 *
 * Only fbevents.js is loaded here — the queue stub and `fbq('init')` live in
 * @lib/meta-pixel so that events fired from effects during hydration are
 * queued ahead of this script rather than lost. The noscript beacon covers
 * visitors with JavaScript disabled.
 */
export default function MetaPixel() {
  if (!META_PIXEL_ID) return null

  return (
    <>
      <Script id="fb-pixel" src={META_SCRIPT_URL} strategy="afterInteractive" />
      <PageViewTracker />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
