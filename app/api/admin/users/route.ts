import { auth } from "@/auth"
import { getAllUsers } from "@/lib/users"
import { isAdmin } from "@/lib/utils-server"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.discordId || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const users = await getAllUsers()
  return NextResponse.json(users)
}
