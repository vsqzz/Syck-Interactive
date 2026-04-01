"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProductForm } from "@/components/dashboard/product-form"
import type { Product } from "@/lib/products"
import { Loader2 } from "lucide-react"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setProduct(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return <p className="text-muted-foreground font-mono text-sm">Product not found.</p>
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Dashboard
        </p>
        <h1 className="font-display text-2xl">Edit: {product.name}</h1>
      </div>
      <ProductForm product={product} isEdit />
    </div>
  )
}
