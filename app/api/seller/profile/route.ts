import { auth } from "@/auth"
import { getSellerProfile, upsertSellerProfile } from "@/lib/seller-profiles"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getSellerProfile(session.user.discordId)
  return NextResponse.json(profile ?? null)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { paypalEmail } = await req.json()
  const profile = await upsertSellerProfile(
    session.user.discordId,
    session.user.name ?? "Unknown",
    { paypalEmail }
  )

  return NextResponse.json(profile)
}
