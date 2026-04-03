import { auth } from "@/auth"
import { getAllPurchases } from "@/lib/purchases"
import { getAllPayPalPayments } from "@/lib/paypal"
import { isAdmin } from "@/lib/utils-server"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [purchases, paypalPayments] = await Promise.all([
    getAllPurchases(),
    getAllPayPalPayments(),
  ])

  const robuxSales = purchases.map(p => ({
    id: p.id,
    type: "robux" as const,
    productName: p.productName,
    buyerUsername: p.buyerUsername,
    price: p.robuxPrice,
    currency: "R$",
    status: p.status,
    createdAt: p.createdAt,
  }))

  const paypalSales = paypalPayments.map(p => ({
    id: p.id,
    type: "paypal" as const,
    productName: p.productName,
    buyerUsername: p.buyerUsername,
    price: p.paypalPrice,
    currency: "$",
    status: p.status,
    createdAt: p.createdAt,
  }))

  const all = [...robuxSales, ...paypalSales].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json(all)
}
