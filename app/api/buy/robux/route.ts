import { auth } from "@/auth"
import { getProductById } from "@/lib/products"
import { createPurchase, completePurchase } from "@/lib/purchases"
import { createDownloadRecord } from "@/lib/downloads"
import { computeSalePrice } from "@/lib/utils-server"
import { validateCoupon, useCoupon } from "@/lib/discounts"
import { notifySale } from "@/lib/discord"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, couponCode } = await req.json()
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 })
  }

  const product = await getProductById(productId)
  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const { robuxFinal } = computeSalePrice(product)
  let finalPrice = robuxFinal

  if (couponCode) {
    const result = await validateCoupon(
      couponCode,
      productId,
      "robux",
      robuxFinal,
      session.user.discordId
    )
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    finalPrice = result.finalPrice!
    await useCoupon(couponCode, session.user.discordId)
  }

  // When ROBLOX_COOKIE/ROBLOX_UNIVERSE_ID are set, validate-code auto-creates a
  // Developer Product for the exact discounted price. Without those env vars,
  // the Lua falls back to "nearest product above", which charges the wrong amount.
  // Snap finalPrice DOWN to the nearest existing product price point so the game
  // charges exactly what's stored in the purchase and the webhook check passes.
  if (finalPrice > 0 && !(process.env.ROBLOX_COOKIE && process.env.ROBLOX_UNIVERSE_ID)) {
    const PRODUCT_PRICE_POINTS = [5,10,20,25,30,40,50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850,900,950,1000,1500,2500,3000,3500,4000,4500,5000,15000]
    const snapped = [...PRODUCT_PRICE_POINTS].reverse().find(p => p <= finalPrice)
    if (snapped) finalPrice = snapped
  }

  // Free product — skip the payment flow entirely, grant access immediately
  if (finalPrice === 0) {
    const purchase = await createPurchase(
      productId,
      product.name,
      session.user.discordId,
      session.user.name ?? "Unknown",
      0
    )
    // Mark purchase as completed and create download record immediately
    await completePurchase(purchase.id)
    await createDownloadRecord(session.user.discordId, productId, purchase.id)

    notifySale({
      productName: product.name,
      productId: product.id,
      buyerUsername: session.user.name ?? "Unknown",
      buyerDiscordId: session.user.discordId,
      sellerUsername: product.creatorName,
      amount: 0,
      method: "robux",
    }).catch(() => {})

    return NextResponse.json({ free: true, purchaseId: purchase.id })
  }

  const purchase = await createPurchase(
    productId,
    product.name,
    session.user.discordId,
    session.user.name ?? "Unknown",
    finalPrice
  )

  return NextResponse.json({
    code: purchase.code,
    purchaseId: purchase.id,
    robuxPrice: finalPrice,
    expiresAt: purchase.expiresAt,
  })
}
