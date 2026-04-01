import { auth } from "@/auth"
import { getProductById, updateProduct, deleteProduct } from "@/lib/products"
import { isAdmin } from "@/lib/utils-server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const product = await getProductById(id)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = product.creatorId === session.user.discordId
  if (!isOwner && !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  await updateProduct(id, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const product = await getProductById(id)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = product.creatorId === session.user.discordId
  if (!isOwner && !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await deleteProduct(id)
  return NextResponse.json({ ok: true })
}
