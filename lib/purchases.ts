import { readJsonFile, updateJsonFile } from "./storage"
import { nanoid } from "./nanoid"

const FILE = "data/purchases.json"

export interface RobuxPurchase {
  id: string
  code: string
  productId: string
  productName: string
  buyerDiscordId: string
  buyerUsername: string
  robuxPrice: number
  status: "pending" | "completed" | "expired"
  expiresAt: string
  createdAt: string
  completedAt?: string
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function getAllPurchases(): Promise<RobuxPurchase[]> {
  const { data } = await readJsonFile<RobuxPurchase[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getPurchaseById(id: string): Promise<RobuxPurchase | null> {
  const purchases = await getAllPurchases()
  return purchases.find((p) => p.id === id) ?? null
}

export async function getPurchaseByCode(code: string): Promise<RobuxPurchase | null> {
  const purchases = await getAllPurchases()
  return purchases.find((p) => p.code === code && p.status === "pending") ?? null
}

export async function getPurchasesByBuyer(discordId: string): Promise<RobuxPurchase[]> {
  const purchases = await getAllPurchases()
  return purchases.filter((p) => p.buyerDiscordId === discordId)
}

export async function createPurchase(
  productId: string,
  productName: string,
  buyerDiscordId: string,
  buyerUsername: string,
  robuxPrice: number
): Promise<RobuxPurchase> {
  const purchase: RobuxPurchase = {
    id: nanoid(),
    code: generateCode(),
    productId,
    productName,
    buyerDiscordId,
    buyerUsername,
    robuxPrice,
    status: "pending",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    createdAt: new Date().toISOString(),
  }

  await updateJsonFile<RobuxPurchase[]>(FILE, (purchases) => [...purchases, purchase])
  return purchase
}

export async function completePurchase(id: string): Promise<void> {
  await updateJsonFile<RobuxPurchase[]>(FILE, (purchases) =>
    purchases.map((p) =>
      p.id === id
        ? { ...p, status: "completed", completedAt: new Date().toISOString() }
        : p
    )
  )
}

export async function expirePurchase(id: string): Promise<void> {
  await updateJsonFile<RobuxPurchase[]>(FILE, (purchases) =>
    purchases.map((p) => (p.id === id ? { ...p, status: "expired" } : p))
  )
}
