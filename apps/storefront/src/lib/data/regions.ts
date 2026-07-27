"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return await sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    // With the Medusa backend offline (frontend-only dev), this fetch throws
    // ECONNREFUSED. Degrade to an empty list so consumers (getRegion → null)
    // render empty instead of crashing the whole route. No-op when backend is up.
    .catch(() => [] as HttpTypes.StoreRegion[])
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return await sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

// Raks is a single-region store (Pakistan / PKR). The `countryCode` argument is
// ignored and we always return the one configured region, so the starter's data
// layer keeps working without a country prefix in the URL.
export const getRegion = async (_countryCode?: string) => {
  if (regionMap.has("pk")) {
    return regionMap.get("pk")
  }

  const regions = await listRegions()

  if (!regions || !regions.length) {
    return null
  }

  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
    regionMap.set("pk", region)
  })

  return regionMap.get("pk") ?? regions[0]
}
