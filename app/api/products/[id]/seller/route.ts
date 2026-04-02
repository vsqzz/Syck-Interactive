import { getProductById } from "@/lib/products"
import { getSellerProfile } from "@/lib/seller-profiles"
import { NextRequest, NextResponse } from "next/server"

// GET /api/products/[id]/seller - Get seller info for a product (including PayPal email for buyers)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const sellerProfile = await getSellerProfile(product.creatorId)

  return NextResponse.json({
    creatorId: product.creatorId,
    creatorName: product.creatorName,
    paypalEmail: sellerProfile?.paypalEmail ?? null,
  })
}
