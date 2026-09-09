import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * The single price formatter for the storefront. Every visible price goes
 * through here, so the default locale decides how the whole site reads.
 *
 * It used to default to `en-US`, which renders PKR as "PKR 3,500.00". The site
 * is a Pakistani store and its own copy writes prices as "Rs 3,000", so the same
 * page showed two different currency formats and Google's AI Overview picked up
 * the "PKR 5,760.00" form. `en-PK` renders "Rs 3,500", matching the copy.
 *
 * Fraction digits: whole amounts drop the decimals, because retail prices in
 * Pakistan are not quoted in paisa. Anything with a fractional part keeps two,
 * so a total is never silently rounded. An explicit caller value always wins.
 */
export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-PK",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  const isWhole = Number.isInteger(amount)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits: minimumFractionDigits ?? (isWhole ? 0 : 2),
    maximumFractionDigits: maximumFractionDigits ?? (isWhole ? 0 : 2),
  }).format(amount)
}
