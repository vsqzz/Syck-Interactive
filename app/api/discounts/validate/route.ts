import { auth } from "@/auth"
import { validateCoupon } from "@/lib/discounts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { code, productId, paymentMethod, price } = await req.json()
  if (!code || !productId || !paymentMethod || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const result = await validateCoupon(
    code,
    productId,
    paymentMethod,
    price,
    session.user.discordId
  )

  return NextResponse.json(result)
}
