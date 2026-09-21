import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * The shipping options Medusa needs, beyond the two the import created.
 *
 * There are two different kinds here and they must not be confused.
 *
 * CUSTOMER-FACING options are what a cart can be quoted. The storefront picks
 * one by matching its price against the delivery charge it already quoted the
 * shopper, so every one of these is a price the checkout can produce. The site
 * promises free delivery over Rs 3,000 — in the FAQs, in category copy and on
 * the landing pages — and the import only ever created Rs 250 options, so there
 * was no way for a cart to reach a free delivery charge. An order over the
 * threshold would have been recorded, and collected, with Rs 250 the customer
 * was told they would not pay.
 *
 * COURIER options are which company actually carries the parcel. They are
 * chosen by the shop when fulfilling an order, not by the shopper at checkout,
 * so they are created with `enabled_in_store` false. That is load-bearing:
 *
 *   - the Store API filters on that rule, so they are never offered at
 *     checkout and never compete in the storefront's price match. Four options
 *     at Rs 250 would make the match ambiguous and the picked one arbitrary.
 *   - the admin's Create Fulfillment screen filters shipping options by stock
 *     location ONLY, so they still appear in its dropdown.
 *
 * They are priced 0 because they charge the customer nothing: delivery was
 * already paid for by whichever customer-facing option the checkout used.
 * Choosing a courier is a dispatch decision, not a second charge.
 *
 * Run it with:
 *   npx medusa exec ./src/scripts/ensure-shipping-options.js
 *
 * Safe to run repeatedly. Options are matched by name and only created when
 * absent; nothing existing is ever edited.
 */

const CURRENCY = "pkr";

type OptionSpec = {
  name: string;
  amount: number;
  code: string;
  label: string;
  description: string;
  /** false keeps it out of checkout and out of the storefront's price match. */
  enabledInStore: boolean;
};

const REQUIRED: OptionSpec[] = [
  {
    name: "Free Delivery",
    amount: 0,
    code: "free",
    label: "Free",
    description: "Free delivery on orders over Rs 3,000.",
    enabledInStore: true,
  },
  {
    name: "PostEx",
    amount: 0,
    code: "postex",
    label: "PostEx",
    description: "Dispatched with PostEx. Chosen when fulfilling, not at checkout.",
    enabledInStore: false,
  },
  {
    name: "Leopards Courier",
    amount: 0,
    code: "leopards",
    label: "Leopards",
    description:
      "Dispatched with Leopards Courier. Chosen when fulfilling, not at checkout.",
    enabledInStore: false,
  },
];

export default async function ensureShippingOptions({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  });

  // Matched by name rather than by price: the courier options are also priced
  // 0, so a price-based check for "is there a free option" would be satisfied
  // by PostEx and quietly skip creating Free Delivery on a fresh database.
  const present = new Set((options as any[]).map((o) => String(o.name)));
  const missing = REQUIRED.filter((o) => !present.has(o.name));

  if (!missing.length) {
    logger.info(
      `[ensure-shipping-options] all present: ${REQUIRED.map((o) => o.name).join(", ")}`
    );
    return;
  }

  // Reuse the zone and profile the existing options sit in, so a new option is
  // offered under exactly the same conditions as the ones already there.
  const [fulfillmentSet] = await fulfillmentModuleService.listFulfillmentSets(
    { name: "Raks Delivery" },
    { relations: ["service_zones"] }
  );

  const serviceZone = fulfillmentSet?.service_zones?.[0];
  if (!serviceZone) {
    throw new Error(
      "[ensure-shipping-options] no service zone on the 'Raks Delivery' fulfillment set — run the import first."
    );
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  if (!profiles.length) {
    throw new Error("[ensure-shipping-options] no shipping profile found.");
  }

  await createShippingOptionsWorkflow(container).run({
    input: missing.map((o) => ({
      name: o.name,
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: serviceZone.id,
      shipping_profile_id: profiles[0].id,
      type: { label: o.label, description: o.description, code: o.code },
      prices: [{ currency_code: CURRENCY, amount: o.amount }],
      rules: [
        {
          attribute: "enabled_in_store",
          value: o.enabledInStore ? "true" : "false",
          operator: "eq" as const,
        },
        { attribute: "is_return", value: "false", operator: "eq" as const },
      ],
    })),
  });

  for (const o of missing) {
    logger.info(
      `[ensure-shipping-options] created "${o.name}" at ${o.amount} ${CURRENCY}` +
        (o.enabledInStore ? "" : " (fulfilment only, hidden from checkout)")
    );
  }
}
