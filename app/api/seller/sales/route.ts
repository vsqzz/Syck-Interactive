import { auth } from "@/auth"
import { getPayPalPaymentsBySeller } from "@/lib/paypal"
import { getAllPurchases } from "@/lib/purchases"
import { getAllProducts } from "@/lib/products"
import { NextResponse } from "next/server"

export interface SellerSale {
  id: string
  type: "robux" | "paypal"
  productName: string
  buyerUsername: string
  price: number
  currency: string
  status: string
  createdAt: string
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sellerId = session.user.discordId

  // Get all products by this seller
  const allProducts = await getAllProducts()
  const myProductIds = new Set(
    allProducts.filter((p) => p.creatorId === sellerId).map((p) => p.id)
  )
  const productNameMap = new Map(
    allProducts.map((p) => [p.id, p.name])
  )

  // Get PayPal payments for this seller
  const paypalPayments = await getPayPalPaymentsBySeller(sellerId)
  const paypalSales: SellerSale[] = paypalPayments.map((p) => ({
    id: p.id,
    type: "paypal",
    productName: p.productName,
    buyerUsername: p.buyerUsername,
    price: p.paypalPrice,
    currency: "$",
    status: p.status,
    createdAt: p.createdAt,
  }))

  // Get Robux purchases for products this seller created
  const allPurchases = await getAllPurchases()
  const robuxSales: SellerSale[] = allPurchases
    .filter((p) => myProductIds.has(p.productId))
    .map((p) => ({
      id: p.id,
      type: "robux",
      productName: productNameMap.get(p.productId) ?? p.productName,
      buyerUsername: p.buyerUsername,
      price: p.robuxPrice,
      currency: "R$",
      status: p.status,
      createdAt: p.createdAt,
    }))

  // Combine and sort by date
  const allSales = [...paypalSales, ...robuxSales].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json(allSales)
}
