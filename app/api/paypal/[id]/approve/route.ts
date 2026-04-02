import { auth } from "@/auth"
import { getPayPalPaymentById, approvePayPalPayment } from "@/lib/paypal"
import { getProductById } from "@/lib/products"
import { createDownloadRecord } from "@/lib/downloads"
import { isAdmin } from "@/lib/utils-server"
import { notifySale } from "@/lib/discord"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const payment = await getPayPalPaymentById(id)
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  const isCreator = payment.sellerId === session.user.discordId
  if (!isCreator && !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Payment is not pending" }, { status: 400 })
  }

  await approvePayPalPayment(id)
  await createDownloadRecord(payment.buyerDiscordId, payment.productId, payment.id)

  const product = await getProductById(payment.productId).catch(() => null)
  notifySale({
    productName: payment.productName,
    productId: payment.productId,
    buyerUsername: payment.buyerUsername,
    buyerDiscordId: payment.buyerDiscordId,
    sellerUsername: product?.creatorName,
    amount: payment.paypalPrice,
    method: "paypal",
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
