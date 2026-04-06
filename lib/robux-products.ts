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
    return null
  }

  try {
    // Step 1: get CSRF token (Roblox requires it for mutating POST requests)
    const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
    })
    const csrfToken = csrfRes.headers.get("x-csrf-token") ?? ""
    if (!csrfToken) {
      console.error("[robux-products] Failed to get CSRF token, status:", csrfRes.status)
      return null
    }

    // Step 2: create the Developer Product
    // Roblox develop API uses camelCase field names in request bodies
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
          name: `Payment ${price} R$`,
          description: `Syck Interactive – ${price} Robux payment`,
          iconImageAssetId: 0,
        }),
      }
    )

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error("[robux-products] Create failed:", createRes.status, errText)
      return null
    }

    const created = await createRes.json()
    // Response uses "id" (number) — fall back to checking "Id" for older API versions
    const newProductId: number = created.id ?? created.Id ?? 0
    if (!newProductId) {
      console.error("[robux-products] No ID in create response:", JSON.stringify(created))
      return null
    }

    // Step 3: set the price on the newly created product
    const updateRes = await fetch(
      `https://develop.roblox.com/v1/developer-products/${newProductId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `.ROBLOSECURITY=${cookie}`,
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          Name: `Payment ${price} R$`,
          Description: `Syck Interactive – ${price} Robux payment`,
          IconImageAssetId: 0,
          PriceInRobux: price,
        }),
      }
    )

    if (!updateRes.ok) {
      const errText = await updateRes.text()
      // Non-fatal: product exists but price might not be set; log and continue
      console.warn("[robux-products] Price update failed:", updateRes.status, errText)
    }

    // Step 4: persist to storage
    const updated: ProductMap = { ...(map as ProductMap), [String(price)]: newProductId }
    await writeJsonFile(FILE, updated, sha)

    console.log(`[robux-products] Created product ${newProductId} for ${price} R$`)
    return newProductId
  } catch (err) {
    console.error("[robux-products] Error:", err)
    return null
  }
}
