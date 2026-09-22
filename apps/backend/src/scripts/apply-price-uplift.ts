import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
import { readFileSync } from "fs";
import path from "path";

/**
 * Apply a one-off catalogue-wide price rise.
 *
 * September 2026: every price went up 30%, rounded to the nearest price ending
 * in 99. The numbers are not computed here — they are read from
 * `data/price-uplift-2026-09.json`, which carries the old and the new amount
 * for all 884 variants.
 *
 * That file, rather than a multiplier in code, is the whole design. This script
 * runs on **every** deploy, and a script that multiplied by 1.3 would raise
 * prices another 30% each time the service restarted. Absolute target amounts
 * cannot compound.
 *
 * Each variant is matched on what it currently costs:
 *
 *   current == old   ->  updated to the new price
 *   current == new   ->  already applied, skipped
 *   anything else    ->  somebody edited it in the admin since the file was
 *                        generated. Left alone and logged as drift.
 *
 * The third case is the one that matters. Without it, a price typed into the
 * Medusa admin would be silently reverted on the next deploy, and the shop
 * would have no way to tell that the deploy had undone their work. Prices are
 * meant to be editable in the admin; this script exists to move them once, not
 * to own them forever.
 *
 * Run it by hand with:
 *   npx medusa exec ./src/scripts/apply-price-uplift.js
 *
 * To reverse the rise, swap `old` and `new` throughout the JSON file and
 * deploy. The drift guard then reads the other way round and puts every
 * untouched variant back.
 */

type UpliftFile = {
  id: string;
  currency: string;
  multiplier: number;
  rounding: string;
  variants: Record<
    string,
    { handle: string; product: string; variant: string; old: number; new: number }
  >;
};

export default async function applyPriceUplift({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const file: UpliftFile = JSON.parse(
    readFileSync(
      path.join(__dirname, "..", "data", "price-uplift-2026-09.json"),
      "utf-8"
    )
  );

  const currency = (file.currency || "pkr").toLowerCase();
  const targets = file.variants ?? {};
  const ids = Object.keys(targets);

  if (!ids.length) {
    logger.info("[price-uplift] nothing listed; skipping.");
    return;
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "prices.amount", "prices.currency_code"],
    filters: { id: ids },
  });

  const updates: {
    id: string;
    prices: { currency_code: string; amount: number }[];
  }[] = [];
  let done = 0;
  const drifted: string[] = [];

  for (const variant of variants as any[]) {
    const target = targets[variant.id];
    if (!target) continue;

    const price = (variant.prices ?? []).find(
      (p: any) => String(p.currency_code).toLowerCase() === currency
    );
    // No price at all is backfill-prices' job, not this one. Touching it here
    // would give a placeholder-priced variant an uplifted price it never had.
    if (!price) continue;

    if (price.amount === target.new) {
      done++;
      continue;
    }

    if (price.amount !== target.old) {
      drifted.push(
        `${target.product} [${target.variant}] is Rs ${price.amount}, expected Rs ${target.old}`
      );
      continue;
    }

    updates.push({
      id: variant.id,
      prices: [{ currency_code: currency, amount: target.new }],
    });
  }

  const missing = ids.length - (variants as any[]).length;
  if (missing > 0) {
    logger.warn(
      `[price-uplift] ${missing} variant id(s) in the file are not in the catalogue.`
    );
  }

  logger.info(
    `[price-uplift] ${file.id}: ${ids.length} listed, ${done} already applied, ` +
      `${drifted.length} edited since, ${updates.length} to raise.`
  );

  for (const d of drifted) {
    logger.warn(`[price-uplift] drift — ${d}; left alone.`);
  }

  if (!updates.length) {
    logger.info("[price-uplift] nothing to do.");
    return;
  }

  // Same batching as backfill-prices, for the same reason: the workflow runs
  // every variant's price set in one transaction and rolls the whole batch back
  // on failure, so smaller batches mean a failure costs less and the log says
  // how far it got.
  const BATCH = 25;
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH);
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: slice },
    });
    logger.info(
      `[price-uplift] raised ${Math.min(i + BATCH, updates.length)}/${updates.length}`
    );
  }

  logger.info(
    `[price-uplift] done. ${updates.length} variant(s) moved to their ${file.id} price.`
  );
}
