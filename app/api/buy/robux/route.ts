import { auth } from "@/auth"
import { getProductById } from "@/lib/products"
import { createPurchase } from "@/lib/purchases"
import { computeSalePrice } from "@/lib/utils-server"
import { validateCoupon, useCoupon } from "@/lib/discounts"
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
