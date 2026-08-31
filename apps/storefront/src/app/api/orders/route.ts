import { NextResponse } from "next/server"

import { findCatalogVariant } from "@lib/catalog-snapshot"
import {
  OrderLine,
  OrderPayload,
  isOrderEmailConfigured,
  missingEmailVars,
  sendOrderEmail,
  verifyOrderEmail,
} from "@lib/order-email"
import { shippingFor } from "@lib/shipping"

/**
 * Email order endpoint.
 *
 * Stands in for Medusa's checkout while raks.pk runs without a backend: the
 * cart lives in the browser (see `lib/local-cart.ts`) and an order becomes an
 * email rather than a row in a database.
 *
 * Because the cart is client-side, nothing the browser posts about a product
 * is trusted. Only variant ids and quantities are read from the request; every
 * title, SKU and price is rebuilt from the catalog snapshot, so a tampered
 * localStorage cannot invent items or set its own prices.
 */

// nodemailer needs Node APIs, so this route must not run on the edge runtime.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LINES = 50
const MAX_QUANTITY = 20

/** Orders accepted per client per window, to blunt inbox flooding. */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000

const recent = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recent.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS)

  hits.push(now)
  recent.set(key, hits)

  // The map only grows with distinct clients; drop idle ones opportunistically.
  // forEach rather than for..of: this project compiles without downlevelIteration.
  if (recent.size > 500) {
    recent.forEach((times, key) => {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) recent.delete(key)
    })
  }

  return hits.length > RATE_LIMIT
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return (forwarded?.split(",")[0] ?? "unknown").trim()
}

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

/**
 * A readable order number, e.g. RKS-260831-4F7A.
 *
 * There is no database to hold a sequence, so this only needs to be unique
 * enough to quote back to a customer over the phone.
 */
function orderReference(): string {
  const now = new Date()
  const stamp =
    String(now.getUTCFullYear()).slice(2) +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0")

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()

  return `RKS-${stamp}-${suffix}`
}


/**
 * Configuration check.
 *
 * Answers the one question a failed order cannot: did the SMTP variables
 * actually reach the running app, and does the mailbox accept them? Reading a
 * managed host's logs to find that out is awkward, so this reports it directly.
 *
 * Returns variable *names* and the SMTP host and port — never a username,
 * never a password, and never the provider's raw error, which tends to echo
 * the username back. Rate limited, because it opens a real SMTP session.
 */
export async function GET(request: Request) {
  if (rateLimited("check:" + clientKey(request))) {
    return NextResponse.json(
      { error: "Too many checks. Please wait a few minutes." },
      { status: 429 }
    )
  }

  const missing = missingEmailVars()

  if (missing.length) {
    return NextResponse.json({
      ordersCanBeEmailed: false,
      problem: "missing-configuration",
      missing,
      hint: "Set these in the host's environment variables, then restart the app.",
    })
  }

  const smtp = await verifyOrderEmail()

  return NextResponse.json({
    ordersCanBeEmailed: smtp.reachable,
    problem: smtp.reachable ? null : `smtp-${smtp.reason}`,
    host: process.env.SMTP_HOST ?? null,
    port: Number(process.env.SMTP_PORT || 465),
    hint: smtp.reachable
      ? "SMTP accepted the login. Orders will be emailed."
      : smtp.reason === "authentication"
      ? "The mailbox rejected the username or password."
      : "Could not open an SMTP connection — check the host and port.",
  })
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many orders from this device. Please try again shortly." },
      { status: 429 }
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const customer = {
    first_name: text(body?.customer?.first_name, 80),
    last_name: text(body?.customer?.last_name, 80),
    email: text(body?.customer?.email, 160),
    phone: text(body?.customer?.phone, 40),
    address: text(body?.customer?.address, 300),
    city: text(body?.customer?.city, 80),
    province: text(body?.customer?.province, 80),
    postal_code: text(body?.customer?.postal_code, 20),
    notes: text(body?.customer?.notes, 600),
  }

  const missing = (
    ["first_name", "last_name", "email", "phone", "address", "city"] as const
  ).filter((field) => !customer[field])

  if (missing.length) {
    return NextResponse.json(
      { error: "Please fill in every required delivery detail." },
      { status: 400 }
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 400 }
    )
  }

  // Pakistani mobile numbers are 10-13 digits depending on how they are typed
  // (03xx…, +923xx…), so check the digit count rather than a strict format.
  const digits = customer.phone.replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 15) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    )
  }

  const rawItems = Array.isArray(body?.items) ? body.items : []
  if (!rawItems.length) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 })
  }
  if (rawItems.length > MAX_LINES) {
    return NextResponse.json({ error: "Too many items." }, { status: 400 })
  }

  const items: OrderLine[] = []

  for (const raw of rawItems) {
    const variantId = text(raw?.variant_id, 100)
    const quantity = Math.floor(Number(raw?.quantity))

    if (!variantId || !Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "Your bag contains an invalid item." },
        { status: 400 }
      )
    }

    if (quantity > MAX_QUANTITY) {
      return NextResponse.json(
        { error: `Maximum ${MAX_QUANTITY} of any one item per order.` },
        { status: 400 }
      )
    }

    // The price the browser sent is ignored entirely; this is the real one.
    const variant = findCatalogVariant(variantId)
    if (!variant) {
      return NextResponse.json(
        { error: "An item in your bag is no longer available." },
        { status: 409 }
      )
    }

    items.push({
      product_title: variant.product_title,
      variant_title: variant.variant_title,
      sku: variant.variant_sku,
      handle: variant.product_handle,
      quantity,
      unit_price: variant.unit_price,
      line_total: variant.unit_price * quantity,
    })
  }

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
  const shipping = shippingFor(subtotal)

  const order: OrderPayload = {
    reference: orderReference(),
    placed_at: new Date().toISOString(),
    customer,
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: "pkr",
  }

  if (!isOrderEmailConfigured()) {
    // Fail loudly rather than showing a customer a confirmation for an order
    // nobody will ever receive. sendOrderEmail still logs it first.
    console.error("[order] SMTP not configured; order not delivered")
  }

  try {
    await sendOrderEmail(order)
  } catch (error) {
    console.error("[order] send failed", error)

    return NextResponse.json(
      {
        error:
          "We could not submit your order just now. Please call or WhatsApp us and we will place it for you.",
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    reference: order.reference,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    items: order.items.map((i) => ({
      handle: i.handle,
      product_title: i.product_title,
      variant_title: i.variant_title,
      sku: i.sku,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
  })
}
