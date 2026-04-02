import { getPurchaseByCode, completePurchase } from "@/lib/purchases"
import { createDownloadRecord } from "@/lib/downloads"
import { notifyRobuxPaymentCompleted } from "@/lib/discord-webhook"
import { NextRequest, NextResponse } from "next/server"

// Called by the Roblox game after a Developer Product purchase succeeds.
// Uses plain secret comparison (Lua can't compute HMAC).
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.ROBUX_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let body: {
    code?: string
    secret?: string
    transactionId?: string
    robuxAmount?: number
    robloxUserId?: string
    robloxUsername?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (body.secret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const code = body.code?.toUpperCase().trim()
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  const purchase = await getPurchaseByCode(code)
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found or already completed" }, { status: 404 })
  }

  if (purchase.expiresAt && new Date(purchase.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Purchase code expired" }, { status: 410 })
  }

  const robuxAmount = Number(body.robuxAmount ?? 0)
  if (robuxAmount < purchase.robuxPrice) {
    return NextResponse.json(
      { error: `Insufficient payment: expected ${purchase.robuxPrice}R$, got ${robuxAmount}R$` },
      { status: 400 }
    )
  }

  await completePurchase(purchase.id)
  await createDownloadRecord(purchase.buyerDiscordId, purchase.productId, purchase.id)

  // Send Discord notification for completed Robux payment
  await notifyRobuxPaymentCompleted(
    purchase.productName,
    purchase.buyerUsername,
    robuxAmount
  )

  return NextResponse.json({ ok: true, purchaseId: purchase.id })
}
