import { auth } from "@/auth"
import { getAllReviews } from "@/lib/reviews"
import { isAdmin } from "@/lib/utils-server"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const reviews = await getAllReviews()
  return NextResponse.json(reviews)
}
