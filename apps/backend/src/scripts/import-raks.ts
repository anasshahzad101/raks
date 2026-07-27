import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { readFileSync } from "fs";
import path from "path";

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
type RawCategory = {
  woo_id: string;
  name: string;
  handle: string;
  parent_woo_id: string | null;
  description: string;
  image: string | null;
};

function load<T>(file: string): T {
  const p = path.join(__dirname, "..", "data", file);
  return JSON.parse(readFileSync(p, "utf-8"));
}

export default async function importRaks({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const CURRENCY = "pkr";

  // ---- Sales channel (reuse existing default if present) ----
  let [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels(
    { name: "Default Sales Channel" }
  );
  if (!defaultSalesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "Default Sales Channel", description: "Raks storefront" },
        ],
      },
    });
    defaultSalesChannel = result[0];
  }
  logger.info(`Sales channel: ${defaultSalesChannel.id}`);

  // ---- Store currency -> PKR ----
  const [store] = await storeModuleService.listStores();
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Raks",
        supported_currencies: [{ currency_code: CURRENCY, is_default: true }],
        default_sales_channel_id: defaultSalesChannel.id,
      },
    },
  });
  logger.info("Store set to Raks / PKR");

  // ---- Region: Pakistan ----
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Pakistan",
          currency_code: CURRENCY,
          countries: ["pk"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info(`Region: ${region.id}`);

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "pk", provider_id: "tp_system" }],
  });

  // ---- Stock location ----
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Raks Warehouse",
          address: { city: "Lahore", country_code: "PK", address_1: "" },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  // ---- Shipping profile (use existing default if created by migrations) ----
  let shippingProfile;
  const { data: existingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  if (existingProfiles.length) {
    shippingProfile = existingProfiles[0];
  } else {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default", type: "default" }] },
    });
    shippingProfile = result[0];
  }

  // ---- Fulfillment set / service zone (Pakistan) ----
  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Raks Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Pakistan",
        geo_zones: [{ country_code: "pk", type: "country" }],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Delivery in 2-4 working days across Pakistan.",
          code: "standard",
        },
        prices: [
          { currency_code: CURRENCY, amount: 250 },
          { region_id: region.id, amount: 250 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "Cash on Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "COD",
          description: "Pay cash when your order arrives.",
          code: "cod",
        },
        prices: [
          { currency_code: CURRENCY, amount: 250 },
          { region_id: region.id, amount: 250 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [defaultSalesChannel.id] },
  });
  logger.info("Fulfillment + shipping ready.");

  // ---- Categories (create level-by-level to resolve parents) ----
  const rawCats = load<RawCategory[]>("medusa-categories.json");
  const wooToMedusa: Record<string, string> = {};
  // group by depth
  const byWoo: Record<string, RawCategory> = Object.fromEntries(
    rawCats.map((c) => [c.woo_id, c])
  );
  const depthOf = (c: RawCategory): number => {
    let d = 0;
    let cur: RawCategory | undefined = c;
    while (cur && cur.parent_woo_id && byWoo[cur.parent_woo_id]) {
      cur = byWoo[cur.parent_woo_id];
      d++;
      if (d > 6) break;
    }
    return d;
  };
  const maxDepth = Math.max(...rawCats.map(depthOf));
  for (let d = 0; d <= maxDepth; d++) {
    const level = rawCats.filter((c) => depthOf(c) === d);
    if (!level.length) continue;
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: level.map((c) => ({
          name: c.name,
          handle: c.handle,
          description: c.description || "",
          is_active: true,
          parent_category_id:
            c.parent_woo_id && wooToMedusa[c.parent_woo_id]
              ? wooToMedusa[c.parent_woo_id]
              : null,
        })),
      },
    });
    level.forEach((c, i) => (wooToMedusa[c.woo_id] = result[i].id));
    logger.info(`Categories level ${d}: created ${level.length}`);
  }
  // handle -> medusa id (for product category links)
  const catHandleToId: Record<string, string> = {};
  for (const c of rawCats) catHandleToId[c.handle] = wooToMedusa[c.woo_id];

  // ---- Products (batched) ----
  const rawProducts = load<RawProduct[]>("medusa-products.json");
  const BATCH = 20;
  let created = 0;
  for (let i = 0; i < rawProducts.length; i += BATCH) {
    const slice = rawProducts.slice(i, i + BATCH);
    const input = slice.map((p) => {
      const category_ids = (p.categories || [])
        .map((h) => catHandleToId[h])
        .filter(Boolean);
      return {
        title: p.title,
        handle: p.handle,
        description: p.description || "",
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        category_ids,
        thumbnail: p.thumbnail || undefined,
        images: (p.images || []).map((url) => ({ url })),
        options: p.options.map((o) => ({ title: o.title, values: o.values })),
        variants: p.variants.map((v) => ({
          title: v.title,
          sku: v.sku || undefined,
          options: v.options,
          manage_inventory: false,
          prices:
            v.prices && v.prices.length
              ? v.prices.map((pr) => ({
                  currency_code: pr.currency_code,
                  amount: pr.amount,
                }))
              : [{ currency_code: CURRENCY, amount: 0 }],
        })),
        sales_channels: [{ id: defaultSalesChannel.id }],
        metadata: p.metadata || {},
      };
    });
    await createProductsWorkflow(container).run({ input: { products: input } });
    created += slice.length;
    logger.info(`Products: ${created}/${rawProducts.length}`);
  }

  // ---- Inventory levels (everything in stock) ----
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });
  if (inventoryItems.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryItems.map((item) => ({
          location_id: stockLocation.id,
          stocked_quantity: 1000,
          inventory_item_id: item.id,
        })),
      },
    });
  }
  logger.info(
    `DONE. ${rawProducts.length} products, ${rawCats.length} categories, ${inventoryItems.length} inventory items.`
  );
}
