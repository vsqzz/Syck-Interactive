"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import type { Product } from "@/lib/products"

export default function DashboardProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        const mine = Array.isArray(data)
          ? data.filter((p: Product) => p.creatorId === session?.user?.discordId)
          : []
        setProducts(mine)
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [session])

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (res.ok) setProducts(p => p.filter(x => x.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleActive(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    })
    setProducts(p => p.map(x => x.id === product.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <h1 className="font-display text-2xl">My Products</h1>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#eca8d6]/10 border border-[#eca8d6]/30 text-[#eca8d6] text-sm font-mono rounded-sm hover:bg-[#eca8d6]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <p className="text-muted-foreground font-mono text-sm mb-4">No products yet</p>
          <Link
            href="/dashboard/products/new"
            className="text-[#eca8d6] hover:underline text-sm font-mono"
          >
            Create your first product →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="flex items-center gap-4 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4 transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${i * 60}ms`,
              }}
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 bg-[oklch(0.07_0.008_260)] rounded-sm overflow-hidden shrink-0 border border-[oklch(0.14_0.008_260)]">
                {product.mainImage ? (
                  <Image src={product.mainImage} alt="" width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-display text-muted-foreground/30">
                    {product.name[0]}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-mono text-sm font-medium text-foreground truncate">{product.name}</h3>
                  <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                    product.active
                      ? "text-[#67e8f9] border-[#67e8f9]/30 bg-[#67e8f9]/10"
                      : "text-muted-foreground border-[oklch(0.18_0.008_260)]"
                  }`}>
                    {product.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {product.category} · R${product.robuxPrice.toLocaleString()}
                  {product.paypalPrice ? ` · $${product.paypalPrice}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(product)}
                  className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors text-muted-foreground hover:text-foreground"
                  title={product.active ? "Hide" : "Show"}
                >
                  {product.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  className="p-1.5 hover:bg-destructive/10 rounded-sm transition-colors text-muted-foreground hover:text-destructive"
                >
                  {deletingId === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
