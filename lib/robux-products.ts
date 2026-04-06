/**
 * Manages Roblox Developer Product IDs for each Robux price point.
 * If a price point doesn't exist, automatically creates a new Developer Product
 * via the Roblox API and persists it to data/robux-products.json.
 */

import { readJsonFile, writeJsonFile } from "./storage"

const FILE = "robux-products.json"

type ProductMap = Record<string, number>

export async function getRobloxProductMap(): Promise<ProductMap> {
  const { data } = await readJsonFile<ProductMap>(FILE)
  return (data && typeof data === "object" && !Array.isArray(data)) ? data : {}
}

/** Returns the Roblox Developer Product ID for the given price, creating one if needed. */
export async function getOrCreateRobloxProduct(price: number): Promise<number | null> {
  const { data: map, sha } = await readJsonFile<ProductMap>(FILE)
  const existing = (map as ProductMap)[String(price)]
  if (existing) return existing

  // Need to create a new Developer Product
  const cookie = process.env.ROBLOX_COOKIE
  const universeId = process.env.ROBLOX_UNIVERSE_ID
  if (!cookie || !universeId) {
    console.warn("[robux-products] ROBLOX_COOKIE or ROBLOX_UNIVERSE_ID not set, cannot create product for price", price)
    return null
  }

  try {
    // Step 1: get CSRF token (Roblox requires it for POST requests)
    const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
    })
    const csrfToken = csrfRes.headers.get("x-csrf-token") ?? ""
    if (!csrfToken) {
      console.error("[robux-products] Failed to get CSRF token")
      return null
    }

    // Step 2: create the Developer Product
    const createRes = await fetch(
      `https://develop.roblox.com/v1/universes/${universeId}/developer-products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `.ROBLOSECURITY=${cookie}`,
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          Name: `Payment ${price} R$`,
          PriceInRobux: price,
          Description: `Syck Interactive – ${price} Robux payment`,
        }),
      }
    )

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error("[robux-products] Failed to create product:", createRes.status, errText)
      return null
    }

    const created = await createRes.json()
    const newProductId: number = created.id ?? created.Id
    if (!newProductId) {
      console.error("[robux-products] No ID in response:", created)
      return null
    }

    // Step 3: persist to storage
    const updated: ProductMap = { ...(map as ProductMap), [String(price)]: newProductId }
    await writeJsonFile(FILE, updated, sha)

    console.log(`[robux-products] Created new product for ${price} R$: ${newProductId}`)
    return newProductId
  } catch (err) {
    console.error("[robux-products] Error creating product:", err)
    return null
  }
}
