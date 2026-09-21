import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductVariantsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { readFileSync } from "fs";
import path from "path";

/**
 * Put what `data/medusa-products.json` describes into Medusa.
 *
 * This is what makes "add a product through the repo" real. Editing the file
 * and deploying is not enough on its own: the storefront reads the committed
 * snapshot, but an order is a Medusa order, so a product that exists only in
 * JSON would show on the site and then fail at checkout — the cart would
 * reference a variant the backend has never heard of, and the order would drop
 * to the email fallback.
 *
 * It is deliberately ADD-ONLY.
 *
 *   missing product  -> created
 *   missing variant  -> created on the existing product
 *   anything that already exists -> left completely alone
 *   anything in Medusa but not in the file -> left completely alone
 *
 * Nothing is updated and nothing is deleted. The reason is ownership: prices,
 * stock and copy get edited in the Medusa admin, and a sync that wrote the
 * file's values back over them would silently undo that work on the next
 * deploy. Drift is reported instead, so it is visible without being acted on.
 * If the file should ever win, that has to be a deliberate, separate decision.
 *
 * `import-raks.ts` is not a substitute: it only creates, so running it twice
 * duplicates the whole catalogue. This is the script to run repeatedly.
 *
 * Run it with:
 *   npx medusa exec ./src/scripts/sync-products.js
 *
 * A variant is matched by (product handle, variant title). That pair is unique
 * across all 884 variants in this catalogue and matches Medusa exactly, which
 * is what makes it safe to use as an identity — there are no SKUs to use
 * instead, every one of them is null.
 */

type RawVariant = {
  title: string;
  sku: string | null;
  options: Record<string, string>;
  prices: { currency_code: string; amount: number }[];
  manage_inventory: boolean;
  inv_status: string;
  image: string | null;
};

type RawProduct = {
  title: string;
  handle: string;
  status: string;
  description: string;
  thumbnail: string | null;
  images: string[];
  categories: string[];
  tags: string[];
  options: { title: string; values: string[] }[];
  variants: RawVariant[];
  metadata: Record<string, any>;
};

const CURRENCY = "pkr";

/**
 * Read every row of an entity, not just the first page.
 *
 * `query.graph` paginates, and a short read here is the one bug in this script
 * that would be catastrophic rather than annoying: products missing from the
 * result look exactly like products that need creating, so a half-fetched
 * catalogue would be duplicated into the live shop. The count is checked
 * against what the backend reports and a mismatch throws rather than guesses.
 */
async function fetchAll(
  query: any,
  entity: string,
  fields: string[]
): Promise<any[]> {
  const take = 200;
  const all: any[] = [];
  let skip = 0;
  let count: number | undefined;

  for (;;) {
    const { data, metadata } = await query.graph({
      entity,
      fields,
      pagination: { skip, take },
    });

    all.push(...(data ?? []));
    count = metadata?.count ?? count;

    if (!data?.length) break;
    skip += take;
    if (count !== undefined && all.length >= count) break;
  }

  if (count !== undefined && all.length !== count) {
    throw new Error(
      `[sync-products] read ${all.length} ${entity} rows but the backend reports ${count}. Refusing to continue: a short read here would duplicate the catalogue.`
    );
  }

  return all;
}

/**
 * A variant with no usable price is refused rather than created.
 *
 * This is the exact hole the catalogue fell into once already: the original
 * import turned `prices: []` into `amount: 0`, and 75 variants went live
 * published, in stock and buyable for nothing. A zero renders as a price, so
 * nothing surfaced it. Refusing to create the variant is the only failure mode
 * here that cannot quietly sell something for free.
 */
function priceOf(v: RawVariant): number | undefined {
  const price = (v.prices || []).find(
    (p) => String(p.currency_code).toLowerCase() === CURRENCY
  );
  return price && price.amount > 0 ? price.amount : undefined;
}

export default async function syncProducts({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  const raw: RawProduct[] = JSON.parse(
    readFileSync(
      path.join(__dirname, "..", "data", "medusa-products.json"),
      "utf-8"
    )
  );

  const existing = await fetchAll(query, "product", [
    "id",
    "handle",
    "title",
    "status",
    "variants.id",
    "variants.title",
  ]);

  const byHandle = new Map<string, any>(existing.map((p) => [p.handle, p]));

  const categories = await fetchAll(query, "product_category", ["id", "handle"]);
  const categoryId = new Map<string, string>(
    categories.map((c) => [c.handle, c.id])
  );

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  if (!profiles.length) {
    throw new Error("[sync-products] no shipping profile — run the import first.");
  }
  const shippingProfileId = profiles[0].id;

  const [salesChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  if (!salesChannel) {
    throw new Error("[sync-products] no Default Sales Channel — run the import first.");
  }

  const newProducts: any[] = [];
  const newVariants: { product_id: string; handle: string; variant: any }[] = [];
  const refused: string[] = [];
  const drift: string[] = [];

  for (const p of raw) {
    const current = byHandle.get(p.handle);

    if (!current) {
      const priced = p.variants.filter((v) => priceOf(v) !== undefined);

      if (!priced.length) {
        refused.push(
          `${p.handle} — new product, no variant has a ${CURRENCY} price above 0`
        );
        continue;
      }
      if (priced.length !== p.variants.length) {
        refused.push(
          `${p.handle} — ${p.variants.length - priced.length} of ${p.variants.length} variants have no price and were left out`
        );
      }

      newProducts.push({
        title: p.title,
        handle: p.handle,
        description: p.description || "",
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfileId,
        category_ids: (p.categories || [])
          .map((h) => categoryId.get(h))
          .filter(Boolean),
        thumbnail: p.thumbnail || undefined,
        images: (p.images || []).map((url) => ({ url })),
        options: p.options.map((o) => ({ title: o.title, values: o.values })),
        variants: priced.map((v) => ({
          title: v.title,
          sku: v.sku || undefined,
          options: v.options,
          manage_inventory: false,
          prices: [{ currency_code: CURRENCY, amount: priceOf(v)! }],
        })),
        sales_channels: [{ id: salesChannel.id }],
        metadata: p.metadata || {},
      });
      continue;
    }

    // Product exists. Only genuinely new variants are added to it.
    const seen = new Set(
      (current.variants ?? []).map((v: any) => String(v.title))
    );

    for (const v of p.variants) {
      if (seen.has(String(v.title))) continue;

      const amount = priceOf(v);
      if (amount === undefined) {
        refused.push(`${p.handle} / ${v.title} — new variant with no ${CURRENCY} price above 0`);
        continue;
      }

      newVariants.push({
        product_id: current.id,
        handle: p.handle,
        variant: {
          product_id: current.id,
          title: v.title,
          sku: v.sku || undefined,
          options: v.options,
          manage_inventory: false,
          prices: [{ currency_code: CURRENCY, amount }],
        },
      });
    }

    if (current.title !== p.title) {
      drift.push(`${p.handle} — title differs (Medusa: "${current.title}", file: "${p.title}")`);
    }
  }

  const orphans = existing
    .filter((p) => !raw.some((r) => r.handle === p.handle))
    .map((p) => p.handle);

  logger.info(
    `[sync-products] file ${raw.length} products, Medusa ${existing.length}. ` +
      `To create: ${newProducts.length} product(s), ${newVariants.length} variant(s).`
  );

  for (const line of refused) logger.warn(`[sync-products] refused — ${line}`);
  for (const line of drift) logger.info(`[sync-products] drift — ${line}`);
  if (orphans.length) {
    logger.info(
      `[sync-products] ${orphans.length} product(s) in Medusa are not in the file and were left alone: ${orphans
        .slice(0, 10)
        .join(", ")}${orphans.length > 10 ? " …" : ""}`
    );
  }

  if (newProducts.length) {
    const BATCH = 20;
    for (let i = 0; i < newProducts.length; i += BATCH) {
      await createProductsWorkflow(container).run({
        input: { products: newProducts.slice(i, i + BATCH) },
      });
      logger.info(
        `[sync-products] created ${Math.min(i + BATCH, newProducts.length)}/${newProducts.length} product(s)`
      );
    }
  }

  if (newVariants.length) {
    await createProductVariantsWorkflow(container).run({
      input: { product_variants: newVariants.map((v) => v.variant) },
    });
    for (const v of newVariants) {
      logger.info(`[sync-products] added variant ${v.handle} / ${v.variant.title}`);
    }
  }

  if (!newProducts.length && !newVariants.length) {
    logger.info("[sync-products] nothing to create; Medusa already has everything in the file.");
  }

  // Said plainly, because it is the step people forget. Medusa having the
  // product changes nothing on the site until the snapshot is regenerated and
  // committed — the storefront reads the JSON in the repo, not the backend.
  if (newProducts.length || newVariants.length) {
    logger.info(
      "[sync-products] NOTE: run `npm run export:catalog` against this backend and commit the snapshot, or the storefront will not show any of this."
    );
  }
}
