import { auth } from "@/auth"
import { createReview, getReviewsByProduct, hasReviewed } from "@/lib/reviews"
import { getProductById } from "@/lib/products"
import { getDownloadRecordsByBuyer } from "@/lib/downloads"
import { notifyReview } from "@/lib/discord"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  const reviews = await getReviewsByProduct(productId)
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, rating, comment } = await req.json()

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "productId and rating (1-5) required" }, { status: 400 })
  }

  // Must have downloaded the product to leave a review
  const downloads = await getDownloadRecordsByBuyer(session.user.discordId)
  const hasPurchased = downloads.some((d) => d.productId === productId)
  if (!hasPurchased) {
    return NextResponse.json({ error: "You must purchase this product before reviewing" }, { status: 403 })
  }

  // One review per product per user
  const alreadyReviewed = await hasReviewed(session.user.discordId, productId)
  if (alreadyReviewed) {
    return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 })
  }

  const product = await getProductById(productId)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const review = await createReview({
    productId,
    productName: product.name,
    buyerDiscordId: session.user.discordId,
    buyerUsername: session.user.name ?? "Unknown",
    sellerDiscordId: product.creatorId,
    sellerUsername: product.creatorName,
    rating: Number(rating),
    comment: (comment ?? "").slice(0, 500),
  })

  // Fire-and-forget Discord notification
  notifyReview({
    productName: review.productName,
    productId: review.productId,
    buyerUsername: review.buyerUsername,
    sellerUsername: review.sellerUsername,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }).catch(() => {})

  return NextResponse.json({ ok: true, review })
}
