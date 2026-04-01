import { auth } from "@/auth"
import { getAllCoupons, createCoupon, deleteCoupon, toggleCoupon } from "@/lib/discounts"
import { isAdmin } from "@/lib/utils-server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const coupons = await getAllCoupons()
  return NextResponse.json(coupons)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  // Handle toggle action
  if (body.action === "toggle") {
    await toggleCoupon(body.code, body.active)
    return NextResponse.json({ ok: true })
  }

  // Handle delete action
  if (body.action === "delete") {
    await deleteCoupon(body.code)
    return NextResponse.json({ ok: true })
  }

  // Create new coupon
  const {
    code, type, value, paymentMethod, scope, productId,
    maxUses, onePerUser, expiresAt, active,
  } = body

  if (!code || !type || value === undefined || !paymentMethod || !scope) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  await createCoupon({
    code: code.toUpperCase(),
    type,
    value,
    paymentMethod,
    scope,
    productId,
    maxUses: maxUses ?? null,
    uses: 0,
    usedBy: [],
    onePerUser: onePerUser ?? false,
    expiresAt: expiresAt ?? null,
    active: active ?? true,
    createdBy: session.user.discordId,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
