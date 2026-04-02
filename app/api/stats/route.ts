import { getAllProducts } from "@/lib/products"
import { getUserCount } from "@/lib/users"
import { NextResponse } from "next/server"

// No auth needed — just public counters
export async function GET() {
  const [products, members] = await Promise.all([getAllProducts(), getUserCount()])

  return NextResponse.json(
    {
      products: products.filter((p) => p.active).length,
      members,
    },
    {
      headers: {
        // Allow caching for 30s at the CDN edge so hammering the route doesn't
        // count as thousands of cold invocations
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  )
}
