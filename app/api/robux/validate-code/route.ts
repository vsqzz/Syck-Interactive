import { getPurchaseByCode } from "@/lib/purchases"
import { getProductById } from "@/lib/products"
import { NextRequest, NextResponse } from "next/server"

// Called by the Roblox game before prompting a Developer Product purchase.
// No auth required — the code itself is the secret.
export async function POST(req: NextRequest) {
  let body: { code?: string; robloxUserId?: string; robloxUsername?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const code = body.code?.toUpperCase().trim()
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  const purchase = await getPurchaseByCode(code)
  if (!purchase) {
    return NextResponse.json({ error: "Code not found or already used" }, { status: 404 })
  }

  if (purchase.expiresAt && new Date(purchase.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Code has expired. Please generate a new one on the website." }, { status: 410 })
  }

  const product = await getProductById(purchase.productId)

  return NextResponse.json({
    valid: true,
    productId: purchase.productId,
    productName: purchase.productName,
    robuxPrice: purchase.robuxPrice,
    fileUrl: product?.fileUrl ?? null,
  })
}
