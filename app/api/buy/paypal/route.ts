import { auth } from "@/auth"
import { getProductById } from "@/lib/products"
import { getSellerProfile } from "@/lib/seller-profiles"
import { createPayPalPayment } from "@/lib/paypal"
import { computeSalePrice } from "@/lib/utils-server"
import { validateCoupon, useCoupon } from "@/lib/discounts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, transactionId, couponCode } = await req.json()
  if (!productId || !transactionId) {
    return NextResponse.json({ error: "productId and transactionId required" }, { status: 400 })
  }

  const product = await getProductById(productId)
  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  if (!product.paypalPrice) {
    return NextResponse.json({ error: "Product does not support PayPal" }, { status: 400 })
  }

  const { paypalFinal } = computeSalePrice(product)
  let finalPrice = paypalFinal ?? product.paypalPrice

  if (couponCode) {
    const result = await validateCoupon(
      couponCode,
      productId,
      "paypal",
      finalPrice,
      session.user.discordId
    )
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    finalPrice = result.finalPrice!
    await useCoupon(couponCode, session.user.discordId)
  }

  const sellerProfile = await getSellerProfile(product.creatorId)

  const payment = await createPayPalPayment(
    productId,
    product.name,
    session.user.discordId,
    session.user.name ?? "Unknown",
    product.creatorId,
    finalPrice,
    transactionId
  )

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    sellerPaypalEmail: sellerProfile?.paypalEmail,
  })
}
