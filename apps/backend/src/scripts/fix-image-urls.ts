import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import { STOREFRONT_URL, toAbsoluteMediaUrl } from "../lib/media-url";

/**
 * Point product images at the storefront, so the Medusa admin can show them.
 *
 * The original import stored every image as a site-relative path. The
 * storefront resolves those against its own origin and they work; the admin
 * resolves them against the Railway domain, where nothing is served, so every
 * product image in the admin is broken. See `lib/media-url.ts` for the detail.
 *
 * Run it with:
 *   npx medusa exec ./src/scripts/fix-image-urls.js
 *
 * Orders are handled too, and they are a separate problem rather than the same
 * one. A line item copies the product's thumbnail at the moment the order is
 * placed, so fixing the catalogue does nothing for orders that already exist --
 * their thumbnail is a snapshot of the old relative path and stays broken in
 * the admin's order view forever. Those are rewritten in place; no other field
 * of an order is touched.
 *
 * Idempotent: a url that is already absolute is left exactly as it is, so this
 * can run on every deploy and on a part-converted catalogue.
 */

export default async function fixImageUrls({
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
      fields: ["id", "handle", "thumbnail", "images.id", "images.url"],
      pagination: { skip, take },
    });
    all.push(...(data ?? []));
    count = metadata?.count ?? count;
    if (!data?.length) break;
    skip += take;
    if (count !== undefined && all.length >= count) break;
  }

  const updates: any[] = [];
  let thumbs = 0;
  let images = 0;

  for (const product of all) {
    const nextThumb = toAbsoluteMediaUrl(product.thumbnail);
    const thumbChanged = nextThumb !== product.thumbnail;

    const current: { id: string; url: string }[] = product.images ?? [];
    const nextImages = current.map((i) => ({
      ...i,
      url: toAbsoluteMediaUrl(i.url) as string,
    }));
    const imagesChanged = nextImages.some((n, i) => n.url !== current[i].url);

    if (!thumbChanged && !imagesChanged) continue;

    if (thumbChanged) thumbs++;
    images += nextImages.filter((n, i) => n.url !== current[i].url).length;

    updates.push({
      id: product.id,
      ...(thumbChanged ? { thumbnail: nextThumb } : {}),
      // Images are replaced as a whole list, which is how the workflow takes
      // them. Ids are carried through so existing image rows are updated rather
      // than deleted and recreated — recreating them would reorder the gallery
      // and change which image is first.
      ...(imagesChanged
        ? { images: nextImages.map((i) => ({ id: i.id, url: i.url })) }
        : {}),
    });
  }

  if (!updates.length) {
    logger.info(
      `[fix-image-urls] ${all.length} product(s) checked, every image url is already absolute.`
    );
    return;
  }

  logger.info(
    `[fix-image-urls] rewriting ${thumbs} thumbnail(s) and ${images} image(s) across ${updates.length} product(s) to ${STOREFRONT_URL}`
  );

  const BATCH = 25;
  for (let i = 0; i < updates.length; i += BATCH) {
    await updateProductsWorkflow(container).run({
      input: { products: updates.slice(i, i + BATCH) },
    });
    logger.info(
      `[fix-image-urls] ${Math.min(i + BATCH, updates.length)}/${updates.length}`
    );
  }

  logger.info("[fix-image-urls] products done.");

  await fixOrderThumbnails(container, logger);
}

/**
 * Rewrite the thumbnail each order line item captured when it was created.
 *
 * Only the thumbnail is written. An order is a record of something that
 * happened and its prices, quantities and totals are not this script's
 * business — the image is the one field that points somewhere rather than
 * stating a fact.
 */
async function fixOrderThumbnails(container: MedusaContainer, logger: any) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const orderModuleService: any = container.resolve(Modules.ORDER);

  const take = 100;
  const orders: any[] = [];
  let skip = 0;
  let count: number | undefined;

  for (;;) {
    const { data, metadata } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "items.id", "items.thumbnail"],
      pagination: { skip, take },
    });
    orders.push(...(data ?? []));
    count = metadata?.count ?? count;
    if (!data?.length) break;
    skip += take;
    if (count !== undefined && orders.length >= count) break;
  }

  const updates: { selector: { id: string }; data: { thumbnail: string } }[] = [];

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const next = toAbsoluteMediaUrl(item.thumbnail);
      if (next && next !== item.thumbnail) {
        updates.push({ selector: { id: item.id }, data: { thumbnail: next } });
      }
    }
  }

  if (!updates.length) {
    logger.info(
      `[fix-image-urls] ${orders.length} order(s) checked, every line item thumbnail is already absolute.`
    );
    return;
  }

  await orderModuleService.updateOrderLineItems(updates);
  logger.info(
    `[fix-image-urls] rewrote ${updates.length} line item thumbnail(s) across ${orders.length} order(s).`
  );
}
