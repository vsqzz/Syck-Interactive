import { auth } from "@/auth"
import { getPendingPayPalPayments, getAllPayPalPayments } from "@/lib/paypal"
import { isAdmin } from "@/lib/utils-server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "true"

  const payments = all ? await getAllPayPalPayments() : await getPendingPayPalPayments()
  return NextResponse.json(payments)
}
