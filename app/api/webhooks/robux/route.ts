import { createHmac } from "crypto"
import { getPurchaseByCode, completePurchase } from "@/lib/purchases"
import { createDownloadRecord } from "@/lib/downloads"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const secret = process.env.ROBUX_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-webhook-signature") ?? ""

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let body: { code: string; transactionId: string; robuxAmount: number; buyerDiscordId: string }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { code, robuxAmount, buyerDiscordId } = body

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

  if (robuxAmount < purchase.robuxPrice) {
    return NextResponse.json(
      { error: `Insufficient payment: expected ${purchase.robuxPrice}, got ${robuxAmount}` },
      { status: 400 }
    )
  }

  const actualBuyer = buyerDiscordId || purchase.buyerDiscordId

  await completePurchase(purchase.id)
  await createDownloadRecord(actualBuyer, purchase.productId, purchase.id)

  return NextResponse.json({ ok: true, purchaseId: purchase.id })
}
