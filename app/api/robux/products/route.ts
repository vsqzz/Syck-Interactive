import { getRobloxProductMap } from "@/lib/robux-products"
import { NextResponse } from "next/server"

// Public endpoint — returns the full price→productId map.
// Called by the Roblox game on startup so it can use the latest product list
// without needing to hardcode IDs in the Lua script.
export async function GET() {
  const map = await getRobloxProductMap()
  return NextResponse.json(map, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  })
}
