import { readJsonFile, updateJsonFile } from "./storage"

const FILE = "data/users.json"

export interface SyckUser {
  discordId: string
  username: string
  firstSeenAt: string
  lastSeenAt: string
}

export async function getAllUsers(): Promise<SyckUser[]> {
  const { data } = await readJsonFile<SyckUser[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getUserCount(): Promise<number> {
  const users = await getAllUsers()
  return users.length
}

export async function upsertUser(discordId: string, username: string): Promise<void> {
  await updateJsonFile<SyckUser[]>(FILE, (users) => {
    const existing = users.find((u) => u.discordId === discordId)
    if (existing) {
      return users.map((u) =>
        u.discordId === discordId ? { ...u, username, lastSeenAt: new Date().toISOString() } : u
      )
    }
    return [
      ...users,
      { discordId, username, firstSeenAt: new Date().toISOString(), lastSeenAt: new Date().toISOString() },
    ]
  })
}
