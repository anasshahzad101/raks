# Adding and changing products

The shop has two halves that must agree, and they are not the same system.

**The storefront reads a committed JSON snapshot**, not Medusa. Product pages
are prerendered at build time from `apps/storefront/src/content/catalog/`, so a
change in the Medusa admin is invisible to shoppers until the storefront is
rebuilt from a fresh snapshot.

**Orders are real Medusa orders.** Checkout builds a cart from variant ids, so a
product has to exist *in Medusa* with the *same variant id the snapshot carries*
or the order cannot be created and falls back to email, subject-prefixed
`[NOT IN MEDUSA]`.

So a product is only properly added when it is in both, with matching ids.

## Adding a product

1. **Add it to `src/data/medusa-products.json`.** This is the human-editable
   source. Every variant needs a PKR price above 0 — see *Prices* below.

2. **Push.** The backend redeploys and `sync-products.ts` creates the product in
   Medusa. Watch the deploy log for `[sync-products] created …`.

   Only `apps/backend/**` changes trigger a Railway deploy. If you edited
   nothing else, that is this file's directory, so it will fire.

3. **Re-export the snapshot and commit it**, or the storefront still will not
   show the product:

   ```
   cd apps/storefront
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://raks-production.up.railway.app \
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable key> \
   node scripts/export-catalog.mjs
   ```

   Commit `src/content/catalog/` and push. The storefront rebuilds and the
   product appears.

Two pushes, because the snapshot can only be exported after Medusa has the
product. There is no way around the ordering; the export reads the backend.

## What the sync will and will not do

`sync-products.ts` is **add-only**, and runs on every backend deploy.

| In the file | In Medusa | What happens |
|---|---|---|
| yes | no | product created |
| yes (new variant) | product exists | variant created |
| yes | yes | **left alone** |
| no | yes | **left alone**, listed in the log |

It never updates and never deletes. Prices, stock and copy get edited in the
Medusa admin, and a sync that wrote the file's values back over them would undo
that work on the next deploy. Where the file and Medusa disagree it logs
`[sync-products] drift — …` and changes nothing.

This means **editing an existing product in the JSON does nothing.** Change it
in the Medusa admin, then re-export the snapshot (step 3) so the site catches
up.

## Prices

A variant with no PKR price above 0 is **refused, not created**, and logged as
`[sync-products] refused — …`.

This is deliberate. The original import turned a missing price into `amount: 0`,
and 75 variants went live published, in stock and buyable for nothing. A zero
renders as a price, so nothing surfaced it for weeks. Refusing is the only
failure mode that cannot quietly sell something for free.

`placeholder-prices.json` holds stand-in prices for the 28 products that came
out of the original export unpriced. They are category medians, not real prices,
and want replacing — edit that file and deploy. `backfill-prices.ts` applies
them to any variant still sitting at zero and never overwrites a real price.

## Scripts

All are idempotent and run on every backend deploy, in this order, from
`railway.json`'s `startCommand`:

| Script | Does |
|---|---|
| `db:migrate` | schema migrations — hard failure, the server will not start without it |
| `sync:products` | creates products and variants the file has and Medusa does not |
| `backfill:prices` | prices any variant still at 0 from `placeholder-prices.json` |
| `ensure:shipping` | makes sure a 0-priced delivery option exists for the free-delivery promise |

The three data scripts are wrapped so a failure is logged and stepped over
rather than stopping the backend booting.

**Do not use `railway.json`'s `preDeployCommand`.** It is silently ignored on
this service — the deploy reports success and the commands never run. That cost
a debugging cycle once already, including migrations quietly not running.
`buildCommand` and `startCommand` from the same file do apply.

`import-raks.ts` is the original one-shot import. It only creates, so running it
again duplicates the entire catalogue. Use `sync:products` instead.

## Couriers (PostEx, Leopards)

The courier is chosen by the shop when the order is fulfilled, not by the
shopper at checkout.

**To ship an order:** open it in the Medusa admin → *Create Fulfillment* → pick
**PostEx** or **Leopards Courier** in the shipping option dropdown → add the
tracking number.

They are set up as shipping options with `enabled_in_store` set to `false`.
That flag is doing real work:

- The Store API filters on it, so couriers never appear at checkout. This
  matters because the storefront picks the delivery option by **matching its
  price**. Extra options at the same price would make that match ambiguous and
  the chosen one arbitrary.
- The admin's Create Fulfillment screen filters shipping options by stock
  location only, so the couriers still show up there.

They are priced 0 because they charge the customer nothing — delivery was
already paid via the checkout option. Picking a courier is a dispatch decision,
not a second charge.

**To add another courier:** add it to the `REQUIRED` list in
`src/scripts/ensure-shipping-options.ts` with `enabledInStore: false`, then
deploy. Existing options are never modified, so it is safe to re-run.
