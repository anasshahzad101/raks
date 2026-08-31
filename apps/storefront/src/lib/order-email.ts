import "server-only"

import nodemailer from "nodemailer"

/**
 * Order notification email.
 *
 * Orders are taken without a Medusa backend, so this email *is* the order
 * record — there is no admin to fall back on. Every order is therefore written
 * to the server log before sending, so a delivery failure leaves a recoverable
 * trace in the host logs rather than losing the sale outright.
 *
 * SMTP credentials come from the environment and are read nowhere else:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   ORDER_EMAIL_TO    where orders are sent (defaults to SMTP_USER)
 *   ORDER_EMAIL_FROM  envelope sender (defaults to SMTP_USER)
 */

export type OrderLine = {
  product_title: string
  variant_title: string
  sku: string | null
  handle: string
  quantity: number
  unit_price: number
  line_total: number
}

export type OrderCustomer = {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postal_code: string
  notes: string
}

export type OrderPayload = {
  reference: string
  placed_at: string
  customer: OrderCustomer
  items: OrderLine[]
  subtotal: number
  shipping: number
  total: number
  currency: string
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return currency.toUpperCase() + " " + amount
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderText(order: OrderPayload): string {
  const c = order.customer

  const lines = order.items
    .map((i) => {
      const name = i.variant_title
        ? `${i.product_title} (${i.variant_title})`
        : i.product_title

      return (
        `  ${i.quantity} x ${name}\n` +
        `      ${money(i.unit_price, order.currency)} each = ` +
        `${money(i.line_total, order.currency)}` +
        (i.sku ? `\n      SKU: ${i.sku}` : "")
      )
    })
    .join("\n\n")

  const postcode = c.postal_code ? " " + c.postal_code : ""

  return [
    `NEW ORDER — ${order.reference}`,
    `Placed: ${order.placed_at}`,
    "",
    "CUSTOMER",
    `  ${c.first_name} ${c.last_name}`,
    `  Phone: ${c.phone}`,
    `  Email: ${c.email}`,
    "",
    "DELIVERY ADDRESS",
    `  ${c.address}`,
    `  ${c.city}, ${c.province}${postcode}`,
    "",
    c.notes ? `NOTES\n  ${c.notes}\n` : "",
    "ITEMS",
    lines,
    "",
    `Subtotal: ${money(order.subtotal, order.currency)}`,
    `Shipping: ${order.shipping ? money(order.shipping, order.currency) : "Free"}`,
    `TOTAL:    ${money(order.total, order.currency)}`,
    "",
    "Payment: Cash on delivery",
  ]
    .filter(Boolean)
    .join("\n")
}

function renderHtml(order: OrderPayload): string {
  const c = order.customer
  const label =
    "font-size:13px;text-transform:uppercase;letter-spacing:.08em;" +
    "color:#8a7f70;margin:22px 0 6px"
  const cell = "padding:10px 8px;border-bottom:1px solid #eee"

  const rows = order.items
    .map((i) => {
      const variant = i.variant_title
        ? `<br><span style="color:#666;font-size:13px">${escapeHtml(
            i.variant_title
          )}</span>`
        : ""
      const sku = i.sku
        ? `<br><span style="color:#999;font-size:12px">SKU ${escapeHtml(
            i.sku
          )}</span>`
        : ""

      return (
        `<tr>` +
        `<td style="${cell}"><strong>${escapeHtml(
          i.product_title
        )}</strong>${variant}${sku}</td>` +
        `<td style="${cell};text-align:center">${i.quantity}</td>` +
        `<td style="${cell};text-align:right">${money(
          i.unit_price,
          order.currency
        )}</td>` +
        `<td style="${cell};text-align:right"><strong>${money(
          i.line_total,
          order.currency
        )}</strong></td>` +
        `</tr>`
      )
    })
    .join("")

  const notes = c.notes
    ? `<h2 style="${label}">Notes</h2><p style="margin:0;line-height:1.6">${escapeHtml(
        c.notes
      )}</p>`
    : ""

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#faf8f4;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#221d18">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8e0d4;padding:28px">
  <h1 style="margin:0 0 4px;font-size:20px">New order · ${escapeHtml(
    order.reference
  )}</h1>
  <p style="margin:0;color:#666;font-size:13px">${escapeHtml(
    order.placed_at
  )} · Cash on delivery</p>

  <h2 style="${label}">Customer</h2>
  <p style="margin:0;line-height:1.6">
    <strong>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</strong><br>
    <a href="tel:${escapeHtml(c.phone)}">${escapeHtml(c.phone)}</a><br>
    <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>
  </p>

  <h2 style="${label}">Deliver to</h2>
  <p style="margin:0;line-height:1.6">
    ${escapeHtml(c.address)}<br>
    ${escapeHtml(c.city)}, ${escapeHtml(c.province)} ${escapeHtml(
    c.postal_code
  )}
  </p>

  ${notes}

  <h2 style="${label}">Items</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead>
      <tr style="text-align:left;color:#8a7f70;font-size:12px;text-transform:uppercase">
        <th style="padding:0 8px 8px">Item</th>
        <th style="padding:0 8px 8px;text-align:center">Qty</th>
        <th style="padding:0 8px 8px;text-align:right">Price</th>
        <th style="padding:0 8px 8px;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="width:100%;margin-top:16px;font-size:14px">
    <tr><td style="padding:4px 8px;color:#666">Subtotal</td>
        <td style="padding:4px 8px;text-align:right">${money(
          order.subtotal,
          order.currency
        )}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Shipping</td>
        <td style="padding:4px 8px;text-align:right">${
          order.shipping ? money(order.shipping, order.currency) : "Free"
        }</td></tr>
    <tr><td style="padding:8px;font-size:16px"><strong>Total</strong></td>
        <td style="padding:8px;text-align:right;font-size:16px"><strong>${money(
          order.total,
          order.currency
        )}</strong></td></tr>
  </table>
</div>
</body></html>`
}

/** True when SMTP is configured well enough to attempt a send. */
export function isOrderEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  )
}

export async function sendOrderEmail(order: OrderPayload): Promise<void> {
  // Logged before sending: if SMTP fails this is the only surviving record.
  console.info("[order]", JSON.stringify(order))

  if (!isOrderEmailConfigured()) {
    throw new Error("SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)")
  }

  const port = Number(process.env.SMTP_PORT || 465)

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER as string,
      pass: process.env.SMTP_PASS as string,
    },
  })

  const name = `${order.customer.first_name} ${order.customer.last_name}`

  await transport.sendMail({
    from: process.env.ORDER_EMAIL_FROM || process.env.SMTP_USER,
    to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
    replyTo: order.customer.email || undefined,
    subject: `New order ${order.reference} — ${name} — ${money(
      order.total,
      order.currency
    )}`,
    text: renderText(order),
    html: renderHtml(order),
  })
}
