import { readJsonFile, updateJsonFile } from "./storage"

const FILE = "data/seller-profiles.json"

export interface SellerProfile {
  userId: string
  username: string
  paypalEmail?: string
  registeredAt: string
  updatedAt?: string
}

export async function getAllSellerProfiles(): Promise<SellerProfile[]> {
  const { data } = await readJsonFile<SellerProfile[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getSellerProfile(userId: string): Promise<SellerProfile | null> {
  const profiles = await getAllSellerProfiles()
  return profiles.find((p) => p.userId === userId) ?? null
}

export async function upsertSellerProfile(
  userId: string,
  username: string,
  updates: Partial<Pick<SellerProfile, "paypalEmail">>
): Promise<SellerProfile> {
  let result: SellerProfile | null = null

  await updateJsonFile<SellerProfile[]>(FILE, (profiles) => {
    const existing = profiles.find((p) => p.userId === userId)
    if (existing) {
      result = {
        ...existing,
        username,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return profiles.map((p) => (p.userId === userId ? result! : p))
    } else {
      result = {
        userId,
        username,
        ...updates,
        registeredAt: new Date().toISOString(),
      }
      return [...profiles, result]
    }
  })

  return result!
}
