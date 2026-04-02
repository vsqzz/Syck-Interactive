import type { Product } from "./products"

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID itself
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Checks if a URL is a YouTube link
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}

/**
 * Gets YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

export function isAdmin(discordId: string): boolean {
  const ownerIds = (process.env.OWNER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean)
  return ownerIds.includes(discordId)
}

export function computeSalePrice(product: Product): {
  robuxFinal: number
  paypalFinal: number | undefined
  hasDiscount: boolean
} {
  const salePercent = product.salePercent ?? 0
  const hasDiscount = salePercent > 0

  const robuxFinal = hasDiscount
    ? Math.floor(product.robuxPrice * (1 - salePercent / 100))
    : product.robuxPrice

  const paypalFinal =
    product.paypalPrice !== undefined && hasDiscount
      ? Math.floor(product.paypalPrice * (1 - salePercent / 100) * 100) / 100
      : product.paypalPrice

  return { robuxFinal, paypalFinal, hasDiscount }
}
