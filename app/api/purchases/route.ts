import { auth } from "@/auth"
import { getPurchasesByBuyer } from "@/lib/purchases"
import { getPayPalPaymentsByBuyer } from "@/lib/paypal"
import { getDownloadRecordsByBuyer } from "@/lib/downloads"
import { getProductById } from "@/lib/products"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const discordId = session.user.discordId

  const [robuxPurchases, paypalPayments, downloadRecords] = await Promise.all([
    getPurchasesByBuyer(discordId),
    getPayPalPaymentsByBuyer(discordId),
    getDownloadRecordsByBuyer(discordId),
  ])

  // Combine and enrich
  const combined = []

  for (const p of robuxPurchases.filter(p => p.status === "completed")) {
    const dl = downloadRecords.find(d => d.purchaseId === p.id)
    combined.push({
      type: "robux" as const,
      id: p.id,
      productId: p.productId,
      productName: p.productName,
      price: p.robuxPrice,
      currency: "R$",
      status: p.status,
      createdAt: p.createdAt,
      downloadRecord: dl ?? null,
    })
  }

  for (const p of paypalPayments.filter(p => p.status === "completed")) {
    const dl = downloadRecords.find(d => d.purchaseId === p.id)
    combined.push({
      type: "paypal" as const,
      id: p.id,
      productId: p.productId,
      productName: p.productName,
      price: p.paypalPrice,
      currency: "$",
      status: p.status,
      createdAt: p.createdAt,
      downloadRecord: dl ?? null,
    })
  }

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(combined)
}
