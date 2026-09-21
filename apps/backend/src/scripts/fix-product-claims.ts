import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Correct delivery and shipping claims inside product descriptions.
 *
 * Product copy came over from the supplier with its own shipping terms baked
 * into the HTML, and they contradict what RAKS actually promises everywhere
 * else on the site: free delivery over Rs 5,000 rather than Rs 3,000, and a
 * split 4-5 / 6-7 working day window rather than 5-7.
 *
 * A shopper reads the product page, not the FAQ, so the wrong number is the one
 * they act on — and a delivery promise is a promise. `npm run check:claims` in
 * the storefront flags these, but it can only report; the text lives in Medusa,
 * which is why the fix has to be here.
 *
 * Run it with:
 *   npx medusa exec ./src/scripts/fix-product-claims.js
 *
 * Every rule only matches text that is already wrong, so this is idempotent and
 * a no-op once applied. That also means it will not touch a description someone
 * has since rewritten correctly — only one that still makes the old claim.
 *
 * These values must match `POLICY` in the storefront's `src/lib/raks.ts`. They
 * are duplicated because the two apps share no code; the storefront's
 * check:claims is what catches them drifting apart.
 */

type Rule = {
  what: string;
  find: RegExp;
  replace: string;
};

const RULES: Rule[] = [
  {
    what: "free delivery threshold (Rs 5,000 -> Rs 3,000)",
    find: /above Rs\.?\s?5,?000/gi,
    replace: "above Rs. 3,000",
  },
  {
    what: "paid delivery threshold (Rs 5,000 -> Rs 3,000)",
    find: /below Rs\.?\s?5,?000/gi,
    replace: "below Rs. 3,000",
  },
  {
    what: "delivery window (4-5 metro / 6-7 elsewhere -> 5-7 nationwide)",
    // Spans two <strong> tags and the text between them, so it is matched as
    // one sentence and rewritten whole. The lazy quantifier keeps it from
    // swallowing the rest of the description.
    find: /Delivery time:[\s\S]{0,400}?in other areas/gi,
    replace: "Delivery time: <strong>5–7 working days</strong> across Pakistan",
  },
];

export default async function fixProductClaims({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const take = 200;
  const all: any[] = [];
  let skip = 0;
  let count: number | undefined;

  for (;;) {
    const { data, metadata } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "description"],
      pagination: { skip, take },
    });
    all.push(...(data ?? []));
    count = metadata?.count ?? count;
    if (!data?.length) break;
    skip += take;
    if (count !== undefined && all.length >= count) break;
  }

  const updates: { id: string; description: string }[] = [];
  const changed: string[] = [];

  for (const product of all) {
    const original: string = product.description ?? "";
    if (!original) continue;

    let next = original;
    const applied: string[] = [];

    for (const rule of RULES) {
      if (rule.find.test(next)) {
        applied.push(rule.what);
        next = next.replace(rule.find, rule.replace);
      }
      // Rules are global regexes, and .test advances lastIndex on a global
      // regex — leaving it set would make the next product skip its start.
      rule.find.lastIndex = 0;
    }

    if (next !== original) {
      updates.push({ id: product.id, description: next });
      changed.push(`${product.handle}: ${applied.join("; ")}`);
    }
  }

  if (!updates.length) {
    logger.info(
      `[fix-product-claims] ${all.length} description(s) checked, none make the old claims.`
    );
    return;
  }

  for (const line of changed) logger.info(`[fix-product-claims] ${line}`);

  await updateProductsWorkflow(container).run({
    input: { products: updates },
  });

  logger.info(`[fix-product-claims] corrected ${updates.length} description(s).`);
}
