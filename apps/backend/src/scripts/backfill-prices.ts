import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
import { readFileSync } from "fs";
import path from "path";

/**
 * Give a price to the variants that were imported without one.
 *
 * 28 products came out of the original export with `prices: []`. The import
 * script turns that into `[{ currency_code: "pkr", amount: 0 }]` so the product
 * still has a price set to attach to — which left 75 variants published,
 * in stock (`manage_inventory: false`) and orderable for Rs 0.
 *
 * The amounts come from `data/placeholder-prices.json` and are placeholders,
 * not real prices: each is the median of the other variants in the same
 * category. They exist so nothing sells for nothing while the real numbers are
 * being gathered. Replacing them means editing that file and re-running this.
 *
 * Run it with:
 *   npx medusa exec ./src/scripts/backfill-prices.js
 *
 * Safe to run repeatedly. A variant is only touched when its current price is
 * missing or zero, so a real price — whether it came from the import or was
 * typed into the admin afterwards — is never overwritten. That guard is what
 * makes this safe to leave in a boot sequence.
 */

type PlaceholderFile = {
  currency: string;
  products: Record<string, { title: string; price: number }>;
};

export default async function backfillPrices({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const file: PlaceholderFile = JSON.parse(
    readFileSync(
      path.join(__dirname, "..", "data", "placeholder-prices.json"),
      "utf-8"
    )
  );

  const currency = (file.currency || "pkr").toLowerCase();
  const handles = Object.keys(file.products);

  if (!handles.length) {
    logger.info("[backfill-prices] nothing listed; skipping.");
    return;
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "variants.id",
      "variants.title",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: { handle: handles },
  });

  const found = new Set(products.map((p: any) => p.handle));
  const absent = handles.filter((h) => !found.has(h));
  if (absent.length) {
    // Not fatal: a handle can legitimately disappear if the product was
    // deleted. Worth saying out loud, because the alternative reading is that
    // the file has drifted from the catalogue.
    logger.warn(
      `[backfill-prices] ${absent.length} handle(s) not in the catalogue: ${absent.join(", ")}`
    );
  }

  const updates: { id: string; prices: { currency_code: string; amount: number }[] }[] = [];
  let alreadyPriced = 0;

  for (const product of products as any[]) {
    const target = file.products[product.handle];
    if (!target || !(target.price > 0)) continue;

    for (const variant of product.variants ?? []) {
      const priced = (variant.prices ?? []).some(
        (p: any) =>
          String(p.currency_code).toLowerCase() === currency && p.amount > 0
      );

      if (priced) {
        alreadyPriced++;
        continue;
      }

      updates.push({
        id: variant.id,
        prices: [{ currency_code: currency, amount: target.price }],
      });
    }
  }

  logger.info(
    `[backfill-prices] ${products.length} product(s) checked, ${alreadyPriced} variant(s) already priced, ${updates.length} to fix.`
  );

  if (!updates.length) {
    logger.info("[backfill-prices] nothing to do.");
    return;
  }

  // Batched because updateProductVariantsWorkflow runs every variant's price
  // set in one transaction, and the whole batch rolls back together on failure.
  // Smaller batches mean a failure costs less and the log says how far it got.
  const BATCH = 25;
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH);
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: slice },
    });
    logger.info(
      `[backfill-prices] priced ${Math.min(i + BATCH, updates.length)}/${updates.length}`
    );
  }

  logger.info(
    `[backfill-prices] done. ${updates.length} variant(s) now priced from placeholder-prices.json.`
  );
}
