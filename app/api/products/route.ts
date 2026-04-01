import { auth } from "@/auth"
import { getAllProducts, getActiveProducts, createProduct } from "@/lib/products"
import { getSellerProfile } from "@/lib/seller-profiles"
import { isAdmin } from "@/lib/utils-server"
import { nanoid } from "@/lib/nanoid"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "true"

  if (all && session?.user?.discordId && isAdmin(session.user.discordId)) {
    const products = await getAllProducts()
    return NextResponse.json(products)
  }

  const products = await getActiveProducts()
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getSellerProfile(session.user.discordId)
  if (!profile && !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "You must be a registered seller" }, { status: 403 })
  }

  const body = await req.json()
  const {
    name, description, category, fileType, features,
    robuxPrice, paypalPrice, cryptoPrice, mainImage,
    galleryImages, tags, downloadUrl, salePercent,
  } = body

  if (!name || !description || !category || !fileType || !downloadUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const id = (name as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + nanoid(6).toLowerCase()

  await createProduct({
    id,
    name,
    description,
    category,
    fileType,
    features: features ?? [],
    robuxPrice: robuxPrice ?? 0,
    paypalPrice,
    cryptoPrice,
    mainImage,
    galleryImages: galleryImages ?? [],
    tags: tags ?? [],
    downloadUrl,
    creatorId: session.user.discordId,
    creatorName: session.user.name ?? "Unknown",
    salePercent,
    active: true,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, id })
}
