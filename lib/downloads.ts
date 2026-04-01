import { readJsonFile, updateJsonFile } from "./storage"
import { nanoid } from "./nanoid"

const FILE = "data/downloads.json"

export interface DownloadRecord {
  id: string
  buyerDiscordId: string
  productId: string
  purchaseId: string
  downloadCount: number
  maxDownloads: number
  createdAt: string
  lastDownloadAt?: string
}

export async function getAllDownloadRecords(): Promise<DownloadRecord[]> {
  const { data } = await readJsonFile<DownloadRecord[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getDownloadRecordById(id: string): Promise<DownloadRecord | null> {
  const records = await getAllDownloadRecords()
  return records.find((r) => r.id === id) ?? null
}

export async function getDownloadRecordsByBuyer(discordId: string): Promise<DownloadRecord[]> {
  const records = await getAllDownloadRecords()
  return records.filter((r) => r.buyerDiscordId === discordId)
}

export async function getDownloadRecordByPurchase(purchaseId: string): Promise<DownloadRecord | null> {
  const records = await getAllDownloadRecords()
  return records.find((r) => r.purchaseId === purchaseId) ?? null
}

export async function createDownloadRecord(
  buyerDiscordId: string,
  productId: string,
  purchaseId: string
): Promise<DownloadRecord> {
  // Check if already exists (idempotent)
  const existing = await getDownloadRecordByPurchase(purchaseId)
  if (existing) return existing

  const record: DownloadRecord = {
    id: nanoid(),
    buyerDiscordId,
    productId,
    purchaseId,
    downloadCount: 0,
    maxDownloads: 5,
    createdAt: new Date().toISOString(),
  }

  await updateJsonFile<DownloadRecord[]>(FILE, (records) => [...records, record])
  return record
}

export async function incrementDownload(id: string): Promise<DownloadRecord | null> {
  let updated: DownloadRecord | null = null

  await updateJsonFile<DownloadRecord[]>(FILE, (records) => {
    return records.map((r) => {
      if (r.id === id) {
        if (r.downloadCount >= r.maxDownloads) {
          updated = null
          return r
        }
        updated = {
          ...r,
          downloadCount: r.downloadCount + 1,
          lastDownloadAt: new Date().toISOString(),
        }
        return updated
      }
      return r
    })
  })

  return updated
}
