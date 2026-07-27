import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function setup({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const apiKeyModule = container.resolve(Modules.API_KEY);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);

  const [sc] = await salesChannelModule.listSalesChannels({
    name: "Default Sales Channel",
  });

  // reuse existing publishable key if present
  const existing = await apiKeyModule.listApiKeys({ type: "publishable" });
  let key = existing[0];
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Raks Storefront", type: "publishable", created_by: "system" },
        ],
      },
    });
    key = result[0];
  }
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: key.id, add: [sc.id] },
  }).catch(() => {});

  logger.info(`PUBLISHABLE_KEY=${key.token}`);
  logger.info(`SALES_CHANNEL_ID=${sc.id}`);

  // spot-check one product
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "title",
      "handle",
      "status",
      "categories.name",
      "images.url",
      "variants.title",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: { handle: "new-vest-bra-full-cup-waist-revealing-hollow-push-up-breathable-bra" },
  });
  const p = data[0];
  if (p) {
    logger.info(
      `SAMPLE: ${p.title} | cats=${p.categories?.map((c: any) => c.name).join(",")} | imgs=${p.images?.length} | variants=${p.variants?.length} | price0=${(p.variants?.[0] as any)?.prices?.[0]?.amount} ${(p.variants?.[0] as any)?.prices?.[0]?.currency_code}`
    );
  }
}
