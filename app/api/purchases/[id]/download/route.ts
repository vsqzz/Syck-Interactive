import { auth } from "@/auth"
import { getDownloadRecordById, incrementDownload } from "@/lib/downloads"
import { getProductById } from "@/lib/products"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const record = await getDownloadRecordById(id)

  if (!record) {
    return NextResponse.json({ error: "Download record not found" }, { status: 404 })
  }

  if (record.buyerDiscordId !== session.user.discordId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (record.downloadCount >= record.maxDownloads) {
    return NextResponse.json({ error: "Download limit reached (5/5)" }, { status: 429 })
  }

  const updated = await incrementDownload(id)
  if (!updated) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 429 })
  }

  const product = await getProductById(record.productId)
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json({
    url: product.downloadUrl,
    downloadsUsed: updated.downloadCount,
    maxDownloads: updated.maxDownloads,
  })
}
