import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Make sure Medusa can quote the delivery charge the storefront promises.
 *
 * The site promises free delivery over Rs 3,000 — in the FAQs, in category copy
 * and on the landing pages — and charges Rs 250 below it (see the storefront's
 * `lib/shipping.ts`). The import script only ever created Rs 250 options, so
 * there was no way for a Medusa cart to arrive at a free delivery charge.
 *
 * That gap matters now that orders are real Medusa orders: the cart computes
 * its own total, so an order over Rs 3,000 would have been recorded — and
 * collected — with Rs 250 of delivery the customer was told they would not pay.
 * The storefront picks whichever option matches the charge it quoted, and
 * refuses the order if none does, so this option existing is what keeps the two
 * totals equal.
 *
 * Run it with:
 *   npx medusa exec ./src/scripts/ensure-shipping-options.js
 *
 * Safe to run repeatedly — it creates the option only when no zero-priced one
 * is already there, and never edits an existing option.
 */

const FREE_OPTION_NAME = "Free Delivery";
const CURRENCY = "pkr";

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
    fields: ["id", "name", "prices.amount", "prices.currency_code"],
  });

  const zeroPriced = (options as any[]).filter((o) =>
    (o.prices ?? []).some(
      (p: any) =>
        String(p.currency_code).toLowerCase() === CURRENCY && p.amount === 0
    )
  );

  if (zeroPriced.length) {
    logger.info(
      `[ensure-shipping-options] free option already present: ${zeroPriced
        .map((o) => o.name)
        .join(", ")}`
    );
    return;
  }

  // Reuse the zone and profile the paid options already sit in, so the free
  // option is offered under exactly the same conditions as the Rs 250 one.
  // Anything else would mean a cart could be quoted one and not the other.
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
    input: [
      {
        name: FREE_OPTION_NAME,
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZone.id,
        shipping_profile_id: profiles[0].id,
        type: {
          label: "Free",
          description: "Free delivery on orders over Rs 3,000.",
          code: "free",
        },
        prices: [{ currency_code: CURRENCY, amount: 0 }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });

  logger.info(`[ensure-shipping-options] created "${FREE_OPTION_NAME}" at 0 ${CURRENCY}.`);
}
