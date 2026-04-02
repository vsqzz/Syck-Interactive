import { auth } from "@/auth"
import { getProductById } from "@/lib/products"
import { getSellerProfile } from "@/lib/seller-profiles"
import { createPayPalPayment, approvePayPalPayment } from "@/lib/paypal"
import { createDownloadRecord } from "@/lib/downloads"
import { computeSalePrice } from "@/lib/utils-server"
import { validateCoupon, useCoupon } from "@/lib/discounts"
import { verifyPayPalTransaction } from "@/lib/paypal-verify"
import { notifySale } from "@/lib/discord"
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

  // Try automatic verification via PayPal REST API
  const { verified, manual, error: verifyError } = await verifyPayPalTransaction(
    transactionId,
    finalPrice
  )

  if (verified) {
    await approvePayPalPayment(payment.id)
    await createDownloadRecord(session.user.discordId, productId, payment.id)

    notifySale({
      productName: product.name,
      productId: product.id,
      buyerUsername: session.user.name ?? "Unknown",
      buyerDiscordId: session.user.discordId,
      sellerUsername: product.creatorName,
      amount: finalPrice,
      method: "paypal",
    }).catch(() => {})

    return NextResponse.json({ ok: true, autoApproved: true, paymentId: payment.id })
  }

  if (manual) {
    // No PayPal API credentials configured — manual seller approval
    return NextResponse.json({
      ok: true,
      autoApproved: false,
      paymentId: payment.id,
      sellerPaypalEmail: sellerProfile?.paypalEmail,
    })
  }

  return NextResponse.json({ error: verifyError ?? "Payment verification failed" }, { status: 400 })
}
