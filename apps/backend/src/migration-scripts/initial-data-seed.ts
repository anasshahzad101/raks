import { MedusaContainer } from "@medusajs/framework";

// Demo seed disabled for Raks. Real catalog is imported via
//   npx medusa exec ./src/scripts/import-raks.ts
// (Pakistan region, PKR, 207 products from the WooCommerce migration).
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  // no-op
}
