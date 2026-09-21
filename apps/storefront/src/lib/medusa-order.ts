import "server-only"

/**
 * Record an order in Medusa.
 *
 * The storefront serves its catalogue from the committed snapshot, but an order
 * has to end up somewhere the shop can actually work it — pick, pack, ship,
 * refund. That is Medusa. So the browsing half and the ordering half talk to
 * different places on purpose, and this module is the ordering half.
 *
 * It deliberately does NOT go through `lib/config.ts`'s `sdk`. That client has
 * the snapshot interceptor bolted onto it, and the interceptor answers
 * `/store/regions` locally — which in snapshot mode would hand back the region
 * id of the Medusa that produced the snapshot, not the Medusa we are about to
 * create a cart in. Rather than reason about which calls get intercepted, the
 * order path speaks to the backend directly and is identical in both catalogue
 * modes.
 *
 * Nothing here is allowed to lose a sale. Every failure returns a reason
 * instead of throwing, and the caller falls back to emailing the order with the
 * reason attached, so a broken backend means a manual order rather than no
 * order.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? ""
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

/** How long any single Medusa call may take before the order path gives up. */
const TIMEOUT_MS = 10_000

export type MedusaOrderInput = {
  reference: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  city: string
  province: string
  postal_code: string
  notes: string
  /** Variant id and quantity only — prices come from Medusa, not from here. */
  lines: { variant_id: string; quantity: number }[]
  /** What the customer was quoted, in whole PKR. The cart must agree. */
  expected_subtotal: number
  expected_shipping: number
}

export type MedusaOrderResult =
  | { ok: true; order_id: string; display_id: number | null }
  | { ok: false; reason: string }

export function isMedusaOrderConfigured(): boolean {
  return Boolean(BACKEND_URL && PUBLISHABLE_KEY)
}

async function store<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "content-type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: controller.signal,
    })

    if (!res.ok) {
      // Medusa puts a useful sentence in `message`; keep it, it is the only
      // clue the order email will carry about why this failed.
      let detail = ""
      try {
        const body: any = await res.json()
        detail = body?.message ? `: ${String(body.message).slice(0, 200)}` : ""
      } catch {}
      throw new Error(`${init?.method ?? "GET"} ${path} -> ${res.status}${detail}`)
    }

    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

/** The PKR region. Read from Medusa every time, never from the snapshot. */
async function pkrRegionId(): Promise<string> {
  const { regions } = await store<{ regions: { id: string; currency_code: string }[] }>(
    "/store/regions"
  )

  const region =
    regions?.find((r) => r.currency_code?.toLowerCase() === "pkr") ?? regions?.[0]

  if (!region?.id) throw new Error("no region configured in Medusa")
  return region.id
}

type StoreShippingOption = {
  id: string
  name?: string
  amount?: number
  calculated_price?: { calculated_amount?: number }
}

/**
 * The shipping option whose price equals what the customer was quoted.
 *
 * Matching on the amount rather than on a name is the point: the storefront
 * quotes free delivery over Rs 3,000 and Rs 250 under it, and if Medusa cannot
 * produce an option at that exact figure then completing the cart would record
 * a different delivery charge than the customer agreed to. Better to fail here
 * and let the order be handled by hand.
 */
function pickShippingOption(
  options: StoreShippingOption[],
  expected: number
): StoreShippingOption | undefined {
  return options.find((o) => {
    const amount = o.amount ?? o.calculated_price?.calculated_amount
    return typeof amount === "number" && Math.round(amount) === expected
  })
}

export async function createMedusaOrder(
  input: MedusaOrderInput
): Promise<MedusaOrderResult> {
  if (!isMedusaOrderConfigured()) {
    return { ok: false, reason: "Medusa backend URL or publishable key is not set" }
  }

  try {
    const region_id = await pkrRegionId()

    const address = {
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      address_1: input.address,
      city: input.city,
      province: input.province || undefined,
      postal_code: input.postal_code || undefined,
      country_code: "pk",
    }

    const { cart } = await store<{ cart: { id: string } }>("/store/carts", {
      method: "POST",
      body: {
        region_id,
        email: input.email,
        shipping_address: address,
        billing_address: address,
        items: input.lines.map((l) => ({
          variant_id: l.variant_id,
          quantity: l.quantity,
        })),
        // Carries through to the order, so the reference the customer was shown
        // and quotes on the phone is visible in the Medusa admin.
        metadata: {
          storefront_reference: input.reference,
          customer_notes: input.notes || undefined,
        },
      },
    })

    const { shipping_options } = await store<{
      shipping_options: StoreShippingOption[]
    }>(`/store/shipping-options?cart_id=${encodeURIComponent(cart.id)}`)

    const option = pickShippingOption(shipping_options ?? [], input.expected_shipping)
    if (!option) {
      const seen = (shipping_options ?? [])
        .map((o) => o.amount ?? o.calculated_price?.calculated_amount)
        .join(", ")
      return {
        ok: false,
        reason: `no shipping option priced at ${input.expected_shipping} (offered: ${seen || "none"})`,
      }
    }

    await store(`/store/carts/${cart.id}/shipping-methods`, {
      method: "POST",
      body: { option_id: option.id },
    })

    // Re-read the cart now that items, address and delivery are all on it, and
    // check Medusa arrived at the same money we quoted. A mismatch means the
    // snapshot and the backend disagree about a price; completing anyway would
    // charge a figure the customer never saw.
    const { cart: priced } = await store<{
      cart: { item_subtotal?: number; shipping_subtotal?: number; total?: number }
    }>(`/store/carts/${cart.id}`)

    const expectedTotal = input.expected_subtotal + input.expected_shipping
    const actualTotal = Math.round(priced?.total ?? -1)

    if (actualTotal !== expectedTotal) {
      return {
        ok: false,
        reason: `cart total ${actualTotal} does not match the quoted ${expectedTotal} — catalogue and backend prices disagree`,
      }
    }

    const { payment_collection } = await store<{
      payment_collection: { id: string }
    }>("/store/payment-collections", {
      method: "POST",
      body: { cart_id: cart.id },
    })

    // Cash on delivery: the manual provider records a payment that is collected
    // off-platform, which is what actually happens at the customer's door.
    await store(`/store/payment-collections/${payment_collection.id}/payment-sessions`, {
      method: "POST",
      body: { provider_id: "pp_system_default" },
    })

    const completed = await store<{
      type: string
      order?: { id: string; display_id?: number }
      error?: { message?: string }
    }>(`/store/carts/${cart.id}/complete`, { method: "POST" })

    if (completed.type !== "order" || !completed.order?.id) {
      return {
        ok: false,
        reason: completed.error?.message
          ? `cart not completed: ${completed.error.message}`
          : "cart did not complete into an order",
      }
    }

    return {
      ok: true,
      order_id: completed.order.id,
      display_id: completed.order.display_id ?? null,
    }
  } catch (error: any) {
    return { ok: false, reason: String(error?.message ?? error).slice(0, 300) }
  }
}
