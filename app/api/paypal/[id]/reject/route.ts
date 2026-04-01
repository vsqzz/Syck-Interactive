import { auth } from "@/auth"
import { getPayPalPaymentById, rejectPayPalPayment } from "@/lib/paypal"
import { isAdmin } from "@/lib/utils-server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const payment = await getPayPalPaymentById(id)
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  const isCreator = payment.sellerId === session.user.discordId
  if (!isCreator && !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Payment is not pending" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  await rejectPayPalPayment(id, body.note)

  return NextResponse.json({ ok: true })
}
