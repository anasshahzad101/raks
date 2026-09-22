import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  batchPriceListPricesWorkflow,
  createPriceListsWorkflow,
  updatePriceListsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows";
import { readFileSync } from "fs";
import path from "path";

/**
 * Put a product on sale: a regular price on the variant, a lower price in a
 * Medusa price list of type "sale".
 *
 * That split is what makes the storefront show "Rs 3,199  ~~Rs 4,999~~  Save
 * 36%" with no storefront change at all. The Store API answers
 * `calculated_amount` from the price list and `original_amount` from the
 * variant, and the price components already render both whenever
 * `price_list_type` is "sale". Carts and the order endpoint read the same
 * calculated price, so a shopper is charged exactly what the page shows.
 *
 * Everything comes from `data/sale-prices.json`. Per sale:
 *
 *   regular   the variant's own price. A variant is moved there only from an
 *             amount listed in `previous`; anything else is somebody's admin
 *             edit, which is logged and left alone — the same drift rule as
 *             apply-price-uplift.ts, for the same reason: a deploy must never
 *             silently undo a price typed into the admin.
 *   sale      the price-list price, applied to every eligible variant.
 *   active    `false` parks the price list as a draft, which ends the sale
 *             without touching the regular price. Deleting the entry instead
 *             leaves the price list exactly as it is.
 *
 * Runs on every deploy and is idempotent: a variant already at its regular
 * price and a price list already holding the sale amounts produce no writes.
 * Expect apply-price-uplift.ts, which runs before this, to report the sale
 * variants as "drift" from the second deploy on — they are, deliberately.
 *
 * Run it by hand with:
 *   npx medusa exec ./src/scripts/apply-sale-prices.js
 */

type Sale = {
  id: string;
  active?: boolean;
  title: string;
  description?: string;
  handle: string;
  regular: number;
  sale: number;
  previous?: number[];
};

type SaleFile = { currency: string; sales: Sale[] };

type PriceRow = {
  id: string;
  amount: number;
  currency_code: string;
  price_list_id?: string | null;
  price_set_id?: string;
};

type VariantRow = {
  id: string;
  title: string;
  price_set?: { id: string } | null;
  prices?: PriceRow[];
};

type PriceListRow = {
  id: string;
  title: string;
  status: string;
  type: string;
  prices?: PriceRow[];
};

const PRICE_LIST_FIELDS = [
  "id",
  "title",
  "status",
  "type",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.price_set_id",
];

export default async function applySalePrices({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const file: SaleFile = JSON.parse(
    readFileSync(path.join(__dirname, "..", "data", "sale-prices.json"), "utf-8")
  );

  const currency = (file.currency || "pkr").toLowerCase();
  const sales = file.sales ?? [];

  if (!sales.length) {
    logger.info("[sale-prices] nothing listed; skipping.");
    return;
  }

  // Every price list, matched by title in memory. There are only ever a
  // handful, and a title filter is not something the pricing module promises.
  const loadLists = async (): Promise<PriceListRow[]> => {
    const { data } = await query.graph({
      entity: "price_list",
      fields: PRICE_LIST_FIELDS,
    });
    return data as PriceListRow[];
  };

  let lists = await loadLists();

  for (const sale of sales) {
    const tag = `[sale-prices] ${sale.id}:`;

    if (!(sale.regular > 0) || !(sale.sale > 0) || sale.sale >= sale.regular) {
      logger.warn(
        `${tag} needs 0 < sale < regular (got sale ${sale.sale}, regular ${sale.regular}); skipped.`
      );
      continue;
    }

    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "variants.id",
        "variants.title",
        "variants.price_set.id",
        "variants.prices.id",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.prices.price_list_id",
      ],
      filters: { handle: sale.handle },
    });

    const product = products[0] as { variants?: VariantRow[] } | undefined;
    if (!product) {
      logger.warn(`${tag} ${sale.handle} is not in the catalogue; skipped.`);
      continue;
    }

    const existing = lists.find((l) => l.title === sale.title);

    // ---- 1. The sale is switched off: park the list and move on.
    if (sale.active === false) {
      if (existing && existing.status !== "draft") {
        await updatePriceListsWorkflow(container).run({
          input: { price_lists_data: [{ id: existing.id, status: "draft" }] },
        });
        logger.info(`${tag} inactive; price list "${sale.title}" set to draft.`);
      } else {
        logger.info(`${tag} inactive; nothing to do.`);
      }
      continue;
    }

    // ---- 2. The regular price on the variants themselves.
    const previous = new Set(sale.previous ?? []);
    const raise: {
      id: string;
      prices: { currency_code: string; amount: number }[];
    }[] = [];
    const eligible: VariantRow[] = [];

    for (const variant of product.variants ?? []) {
      const base = (variant.prices ?? []).find(
        (p) =>
          !p.price_list_id &&
          String(p.currency_code).toLowerCase() === currency
      );

      if (!base) {
        logger.warn(`${tag} ${variant.title} has no ${currency} price; left alone.`);
        continue;
      }

      const amount = Number(base.amount);

      if (amount === sale.regular) {
        eligible.push(variant);
        continue;
      }

      if (previous.has(amount)) {
        raise.push({
          id: variant.id,
          prices: [{ currency_code: currency, amount: sale.regular }],
        });
        eligible.push(variant);
        continue;
      }

      logger.warn(
        `${tag} drift — ${variant.title} is Rs ${amount}, expected Rs ${sale.regular}; left alone and not put on sale.`
      );
    }

    if (raise.length) {
      await updateProductVariantsWorkflow(container).run({
        input: { product_variants: raise },
      });
      logger.info(
        `${tag} ${raise.length} variant(s) moved to the regular price Rs ${sale.regular}.`
      );
      // The variant update rewrites the price set, so anything read about the
      // list's prices before it may be stale. Read it again.
      lists = await loadLists();
    }

    if (!eligible.length) {
      logger.warn(`${tag} no variant is eligible for the sale price; skipped.`);
      continue;
    }

    // ---- 3. The sale price list.
    const list = lists.find((l) => l.title === sale.title);

    if (!list) {
      await createPriceListsWorkflow(container).run({
        input: {
          price_lists_data: [
            {
              title: sale.title,
              description: sale.description ?? sale.id,
              type: "sale",
              status: "active",
              prices: eligible.map((v) => ({
                variant_id: v.id,
                amount: sale.sale,
                currency_code: currency,
              })),
            },
          ],
        },
      });
      logger.info(
        `${tag} created price list "${sale.title}" with ${eligible.length} price(s) at Rs ${sale.sale}.`
      );
      continue;
    }

    if (list.type !== "sale") {
      // The type cannot be changed after creation, and an "override" list
      // would hide the regular price instead of striking it through.
      logger.warn(
        `${tag} price list "${sale.title}" is type "${list.type}", not "sale"; delete it in the admin and redeploy. Left alone.`
      );
      continue;
    }

    if (list.status !== "active") {
      await updatePriceListsWorkflow(container).run({
        input: { price_lists_data: [{ id: list.id, status: "active" }] },
      });
      logger.info(`${tag} price list "${sale.title}" reactivated.`);
    }

    // Price-list prices know their price set, not their variant; the variant
    // query above carried each variant's price set id for exactly this join.
    const byPriceSet = new Map<string, PriceRow>();
    for (const p of list.prices ?? []) {
      if (String(p.currency_code).toLowerCase() === currency && p.price_set_id) {
        byPriceSet.set(p.price_set_id, p);
      }
    }

    const create: { variant_id: string; amount: number; currency_code: string }[] = [];
    const update: {
      id: string;
      variant_id: string;
      amount: number;
      currency_code: string;
    }[] = [];
    let right = 0;

    for (const variant of eligible) {
      const current = variant.price_set?.id
        ? byPriceSet.get(variant.price_set.id)
        : undefined;

      if (!current) {
        create.push({
          variant_id: variant.id,
          amount: sale.sale,
          currency_code: currency,
        });
      } else if (Number(current.amount) !== sale.sale) {
        update.push({
          id: current.id,
          variant_id: variant.id,
          amount: sale.sale,
          currency_code: currency,
        });
      } else {
        right++;
      }
    }

    if (!create.length && !update.length) {
      logger.info(
        `${tag} price list already holds ${right} price(s) at Rs ${sale.sale}; nothing to do.`
      );
      continue;
    }

    await batchPriceListPricesWorkflow(container).run({
      input: { data: { id: list.id, create, update, delete: [] } },
    });
    logger.info(
      `${tag} price list updated: ${create.length} added, ${update.length} corrected, ${right} already right.`
    );
  }
}
