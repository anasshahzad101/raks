import { Metadata } from "next"
import { notFound } from "next/navigation"

import { toGaItem } from "@lib/analytics"
import { CampaignPage, campaignPages, getCampaignPage } from "@lib/campaigns"
import { listProducts } from "@lib/data/products"
import { BRAND, absoluteUrl, whatsappUrl } from "@lib/raks"
import { PRODUCT_OPTION_FIELDS } from "@lib/util/product-fields"
import { HttpTypes } from "@medusajs/types"
import { ViewItem } from "@modules/analytics/ecommerce-events"
import BuyBox, {
  CampaignColourOption,
  CampaignVariant,
} from "@modules/campaign/components/buy-box"
import ColourGallery from "@modules/campaign/components/colour-gallery"

type Props = { params: Promise<{ slug: string }> }

/**
 * Ad landing pages, one per entry in `lib/campaigns.ts`.
 *
 * Prerendered like the product pages, but revalidated every ten minutes so a
 * price change in Medusa reaches the page without a redeploy. The product page
 * has no such refresh; a campaign page showing one price while checkout
 * charges another would waste the ad spend that brought the visitor here.
 */
export const revalidate = 600
export const dynamicParams = false

export function generateStaticParams() {
  return campaignPages.map((p) => ({ slug: p.slug }))
}

async function loadProduct(page: CampaignPage) {
  return listProducts({
    countryCode: "pk",
    queryParams: { handle: page.handle, fields: PRODUCT_OPTION_FIELDS },
  }).then(({ response }) => response.products[0])
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const page = getCampaignPage(slug)
  if (!page) notFound()

  const product = await loadProduct(page)
  // The link preview an ad or a WhatsApp share shows: the campaign's own lead
  // photo when it has one, the product thumbnail otherwise.
  const lead =
    page.colours[0]?.photos?.[0]?.src ??
    page.colours[0]?.image ??
    product?.thumbnail ??
    undefined
  const image = lead ? absoluteUrl(lead) : undefined
  const url = absoluteUrl(`/offer/${page.slug}/`)

  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    // Paid traffic only. The product page is the indexable version of this
    // content; this one is kept out of search so the two never compete.
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      siteName: BRAND.name,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: image ? [image] : [],
    },
  }
}

const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/** The value of the variant's option whose title matches, e.g. its colour. */
function optionValue(
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant,
  title: RegExp
): string {
  for (const o of variant.options ?? []) {
    const name =
      (o as any).option?.title ??
      product.options?.find((po) => po.id === o.option_id)?.title ??
      ""
    if (title.test(name) && o.value) return String(o.value)
  }
  return ""
}

/**
 * Prices as Medusa reports them. `compareAt` is the variant's own price when a
 * sale price list is in force; until the backend has applied one, it falls
 * back to the owner-stated regular price, and to nothing at all once the sale
 * ends and the variant simply costs what it costs.
 */
function toCampaignVariants(
  product: HttpTypes.StoreProduct,
  page: CampaignPage
): CampaignVariant[] {
  return (product.variants ?? []).flatMap((v) => {
    const cp = (v as any).calculated_price
    const price = cp?.calculated_amount
    if (typeof price !== "number" || price <= 0) return []

    const original = cp?.original_amount
    const onSale =
      cp?.calculated_price?.price_list_type === "sale" &&
      typeof original === "number" &&
      original > price
    const compareAt = onSale
      ? original
      : page.regularPrice > price
      ? page.regularPrice
      : null

    return [
      {
        id: v.id,
        title: v.title ?? "",
        colour: optionValue(product, v, /^colou?r$/i),
        size: optionValue(product, v, /^sizes?$/i),
        price,
        compareAt,
        // Variant-level only. The product thumbnail is one colour's photo,
        // so falling back to it here would show maroon for "Blue".
        image: v.images?.[0]?.url ?? v.thumbnail ?? null,
        thumbnail: v.thumbnail ?? null,
      },
    ]
  })
}

/** Small before large, whatever order Medusa happens to list them in. */
const SIZE_ORDER = ["xs", "s", "small", "m", "medium", "l", "large", "xl", "xxl"]
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.trim().toLowerCase())
  return i === -1 ? SIZE_ORDER.length : i
}

function SectionHeading({
  eyebrow,
  title,
  center,
}: {
  eyebrow: string
  title: string
  center?: boolean
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <span className="text-[11.5px] uppercase tracking-[0.2em] text-gold">
        {eyebrow}
      </span>
      <h2 className="mt-2.5 font-display text-[28px] font-medium leading-[1.15] text-ink small:text-[36px]">
        {title}
      </h2>
    </div>
  )
}

export default async function CampaignOfferPage(props: Props) {
  const { slug } = await props.params
  const page = getCampaignPage(slug)
  if (!page) notFound()

  const product = await loadProduct(page)
  if (!product?.id) notFound()

  // Only the colours the campaign names. The bridal set sells in three, and
  // the ad is for maroon, so the other two do not appear here at all.
  const variants = toCampaignVariants(product, page).filter(
    (v) =>
      !page.colours.length || page.colours.some((c) => same(c.value, v.colour))
  )
  if (!variants.length) notFound()

  const colours: CampaignColourOption[] = page.colours
    .filter((c) => variants.some((v) => same(v.colour, c.value)))
    .map((c) => ({
      value: c.value,
      label: c.label,
      note: c.note,
      image:
        c.image ??
        variants.find((v) => same(v.colour, c.value))?.image ??
        product.thumbnail ??
        null,
      photos: c.photos ?? [],
    }))

  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)))
    .sort((a, b) => sizeRank(a) - sizeRank(b))

  const whatsapp = whatsappUrl(
    `Hi Raks, I have a question about the ${product.title}.`
  )

  return (
    <div className="pb-20 lg:pb-0">
      <ViewItem item={toGaItem(product)} />

      <BuyBox
        productId={product.id}
        handle={product.handle ?? page.handle}
        productTitle={product.title ?? ""}
        category={product.categories?.[0]?.name}
        eyebrow={page.eyebrow}
        headline={page.headline}
        subheadline={page.subheadline}
        ctaLabel={page.ctaLabel}
        reassurance={page.reassurance}
        gift={page.gift}
        whatsappHref={whatsapp}
        fallbackImage={product.thumbnail ?? null}
        variants={variants}
        colours={colours}
        sizes={sizes}
      />

      {/* What's in the set */}
      <section className="border-y border-cream-200 bg-[#fffdf9]">
        <div className="content-container py-12 small:py-16">
          <SectionHeading
            eyebrow="What's in the set"
            title={`${page.pieces.length} pieces. Every one of them in matching silk.`}
          />
          <ol className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 xsmall:grid-cols-2 small:grid-cols-5">
            {page.pieces.map((piece, i) => (
              <li key={piece.name} className="flex flex-col gap-y-2">
                <span className="font-display text-[30px] leading-none text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[22px] font-medium leading-tight text-ink">
                  {piece.name}
                </h3>
                <p className="text-[14px] font-light leading-[1.7] text-[#5c4d42]">
                  {piece.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why */}
      <section className="content-container py-12 small:py-16">
        <SectionHeading
          eyebrow="Why brides choose it"
          title="Bought for one night. Worn for years."
        />
        <div className="mt-8 grid grid-cols-1 gap-5 xsmall:grid-cols-2 small:grid-cols-4">
          {page.reasons.map((r) => (
            <div
              key={r.heading}
              className="border border-cream-300 bg-[#fffdf9] p-6"
            >
              <h3 className="font-display text-[22px] font-medium leading-tight text-ink">
                {r.heading}
              </h3>
              <p className="mt-3 text-[14px] font-light leading-[1.7] text-[#5c4d42]">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Colours: only worth a section when there is a choice to make */}
      {colours.length > 1 && (
        <section className="border-y border-cream-200 bg-[#fffdf9]">
          <div className="content-container py-12 small:py-16">
            <SectionHeading
              eyebrow={`${colours.length} colours`}
              title="Pick yours."
            />
            <div className="mt-8">
              <ColourGallery
                colours={colours}
                productTitle={product.title ?? ""}
              />
            </div>
          </div>
        </section>
      )}

      {/* Sizing + how it works */}
      <section className="content-container grid grid-cols-1 gap-10 py-12 small:grid-cols-2 small:gap-16 small:py-16">
        <div>
          <SectionHeading eyebrow="Sizing" title={page.sizing.heading} />
          <p className="mt-5 max-w-[480px] text-[15px] font-light leading-[1.75] text-[#5c4d42]">
            {page.sizing.body}
          </p>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-[46px] items-center border border-[#d8c6ae] px-6 text-[11.5px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Ask on WhatsApp
          </a>
        </div>
        <div>
          <SectionHeading
            eyebrow="How ordering works"
            title="Three steps. No card needed."
          />
          <ol className="mt-6 flex flex-col gap-y-5">
            {page.steps.map((s, i) => (
              <li key={s.heading} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-accent font-display text-[18px] text-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-medium text-ink">{s.heading}</h3>
                  <p className="mt-1 text-[14px] font-light leading-[1.7] text-[#5c4d42]">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-cream-200 bg-[#fffdf9]">
        <div className="content-container max-w-[860px] py-12 small:py-16">
          <SectionHeading eyebrow="Questions" title="Before you order" />
          <div className="mt-6 divide-y divide-cream-300 border-y border-cream-300">
            {page.faqs.map((f) => (
              <details key={f.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[20px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span
                    className="shrink-0 text-[22px] leading-none text-accent transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[14.5px] font-light leading-[1.75] text-[#5c4d42]">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="content-container py-14 text-center small:py-20">
        <h2 className="mx-auto max-w-[620px] font-display text-[30px] font-medium leading-[1.15] text-ink small:text-[40px]">
          Five pieces, one parcel, paid at your door.
        </h2>
        <p className="mx-auto mt-4 max-w-[460px] text-[15px] font-light leading-[1.75] text-[#5c4d42]">
          {colours.length > 1
            ? "Pick a colour and a size above, add your address, and it is on its way."
            : "Pick your size above, add your address, and it is on its way."}
        </p>
        <a
          href="#buy"
          className="mt-7 inline-flex h-[54px] items-center justify-center bg-accent px-10 text-[12.5px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-burgundy-dark"
        >
          {colours.length > 1 ? "Choose colour and size" : "Choose your size"}
        </a>
      </section>
    </div>
  )
}
