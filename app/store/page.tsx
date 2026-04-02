"use client"

import { useState, useEffect, useRef } from "react"
import { SiteNav } from "@/components/shared/site-nav"
import { ProductCard } from "@/components/store/product-card"
import { BuyModal } from "@/components/store/buy-modal"
import type { Product } from "@/lib/products"
import { Search, Filter, Loader2 } from "lucide-react"

const CATEGORIES = [
  "All",
  "Systems", "Free", "UI", "Models",
  "Websites", "Boats", "Vehicles",
]

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = category === "All" || p.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
      <SiteNav />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div
            className="transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <p className="font-mono text-xs text-muted-foreground tracking-[0.3em] uppercase mb-4">
              Roblox Products
            </p>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
              The <span className="word-gradient">Store</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Premium Roblox scripts, systems, and assets crafted by top creators.
              Pay with Robux or PayPal.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Search + filter bar */}
          <div
            className="flex flex-col md:flex-row gap-4 mb-8 transition-all duration-700 delay-150"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <div className="flex-1 flex items-center gap-2 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-4 py-2.5">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar categories */}
            <aside
              className="hidden md:block w-48 shrink-0 transition-all duration-700 delay-200"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-16px)",
              }}
            >
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                Categories
              </p>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left text-sm px-3 py-2 rounded-sm transition-all font-mono ${
                      category === cat
                        ? "bg-[oklch(0.14_0.008_260)] text-foreground border border-[oklch(0.28_0.008_260)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.09_0.008_260)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </aside>

            {/* Mobile category filter */}
            <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-sm font-mono transition-all ${
                    category === cat
                      ? "bg-[oklch(0.14_0.008_260)] text-foreground border border-[oklch(0.28_0.008_260)]"
                      : "bg-[oklch(0.09_0.008_260)] text-muted-foreground border border-[oklch(0.18_0.008_260)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-muted-foreground font-mono text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((product, i) => (
                    <div
                      key={product.id}
                      className="transition-all duration-500"
                      style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0)" : "translateY(24px)",
                        transitionDelay: `${200 + i * 60}ms`,
                      }}
                    >
                      <ProductCard product={product} onBuy={setSelectedProduct} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <BuyModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}
