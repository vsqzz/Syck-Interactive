import type { Product } from "./products"

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
