import { Metadata } from "next"
import { notFound } from "next/navigation"

import { landingPages, getLandingPage } from "@lib/landing-pages"
import { absoluteUrl } from "@lib/raks"
import LandingTemplate from "@modules/landing/templates"

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return landingPages.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const page = getLandingPage(slug)
  if (!page) {
    notFound()
  }

  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: absoluteUrl(`/collections/${page.slug}/`) },
  }
}

export default async function CollectionLandingPage(props: Props) {
  const { slug } = await props.params
  const page = getLandingPage(slug)
  if (!page) {
    notFound()
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/shop/") },
      {
        "@type": "ListItem",
        position: 3,
        name: page.heading,
        item: absoluteUrl(`/collections/${page.slug}/`),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LandingTemplate page={page} />
    </>
  )
}
