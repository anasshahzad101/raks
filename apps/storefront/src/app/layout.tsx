import { Metadata } from "next"
import { Cormorant_Garamond, Jost, Amiri } from "next/font/google"
import {
  BRAND,
  SITE_URL,
  SEO_TITLE_TEMPLATE,
  SEO_DEFAULT_TITLE,
  absoluteUrl,
  ORG_ID,
  SAME_AS,
  BUSINESS_FACTS,
} from "@lib/raks"
import GoogleAnalytics from "@modules/analytics/google-analytics"
import MetaPixel from "@modules/analytics/meta-pixel"
import "styles/globals.css"

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
})

const arabic = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap",
})

export const metadata: Metadata = {
  // Must be the canonical production origin: og:image/twitter:image are resolved
  // against this, so using the dev base URL would ship localhost image URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_DEFAULT_TITLE,
    template: SEO_TITLE_TEMPLATE,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  // NOTE: no site-wide `alternates.canonical` — it would make every page that does
  // not set its own canonical claim to be the homepage. Each route sets its own.
  icons: { icon: BRAND.favicon, apple: BRAND.favicon },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: SEO_DEFAULT_TITLE,
    description: BRAND.description,
    url: SITE_URL,
    locale: BRAND.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_DEFAULT_TITLE,
    description: BRAND.description,
  },
  robots: { index: true, follow: true },
}

/**
 * The single Organization node for the whole site.
 *
 * Emitted here and only here. Other routes reference it by `@id` rather than
 * repeating it, which previously produced three competing Organization objects
 * on every blog page.
 *
 * `telephone` and the city are confirmed against the owner's own Google Business
 * Profile and Facebook page. Still deliberately absent until the owner confirms
 * them: the street address, `foundingDate` and `founder`. A guess in any of
 * those propagates straight into how answer engines describe the business.
 */
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": ORG_ID,
  name: BRAND.name,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl(BRAND.logo),
  },
  image: absoluteUrl(BRAND.logo),
  description: BRAND.description,
  email: BRAND.email,
  telephone: BUSINESS_FACTS.telephone,
  address: {
    "@type": "PostalAddress",
    addressLocality: BUSINESS_FACTS.addressLocality,
    addressCountry: BUSINESS_FACTS.addressCountry,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: BUSINESS_FACTS.telephone,
    email: BRAND.email,
    areaServed: BUSINESS_FACTS.addressCountry,
    availableLanguage: ["en", "ur"],
  },
  areaServed: {
    "@type": "Country",
    name: BUSINESS_FACTS.areaServed,
  },
  currenciesAccepted: BUSINESS_FACTS.currency,
  paymentAccepted: BUSINESS_FACTS.paymentAccepted,
  knowsAbout: [...BUSINESS_FACTS.knowsAbout],
  sameAs: SAME_AS,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${display.variable} ${sans.variable} ${arabic.variable}`}
    >
      <body className="font-sans text-ink antialiased bg-cream-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <main className="relative">{props.children}</main>
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  )
}
