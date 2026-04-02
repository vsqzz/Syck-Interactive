import { readJsonFile, updateJsonFile } from "./storage"
import { nanoid } from "./nanoid"

const FILE = "data/reviews.json"

export interface Review {
  id: string
  productId: string
  productName: string
  buyerDiscordId: string
  buyerUsername: string
  sellerDiscordId: string
  sellerUsername: string
  rating: number // 1-5
  comment: string
  createdAt: string
}

export async function getAllReviews(): Promise<Review[]> {
  const { data } = await readJsonFile<Review[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const all = await getAllReviews()
  return all.filter((r) => r.productId === productId)
}

export async function getReviewsByBuyer(discordId: string): Promise<Review[]> {
  const all = await getAllReviews()
  return all.filter((r) => r.buyerDiscordId === discordId)
}

export async function hasReviewed(buyerDiscordId: string, productId: string): Promise<boolean> {
  const all = await getAllReviews()
  return all.some((r) => r.buyerDiscordId === buyerDiscordId && r.productId === productId)
}

export async function createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const review: Review = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  }
  await updateJsonFile<Review[]>(FILE, (reviews) => [...reviews, review])
  return review
}
