"use client"

import { useEffect, useState } from "react"
import { Loader2, TrendingUp } from "lucide-react"
import { RobuxIcon } from "@/components/icons/robux-icon"
import { PayPalIcon } from "@/components/icons/paypal-icon"

interface SaleEntry {
  id: string
  type: "robux" | "paypal"
  productName: string
  buyerUsername: string
  price: number
  currency: string
  status: string
  createdAt: string
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<SaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [filter, setFilter] = useState<"all" | "robux" | "paypal">("all")

  useEffect(() => {
    fetch("/api/admin/sales")
      .then(r => r.json())
      .then(data => {
        setSales(Array.isArray(data) ? data : [])
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [])

  const completed = sales.filter(s => s.status === "completed")
  const robuxRevenue = completed.filter(s => s.type === "robux").reduce((sum, s) => sum + s.price, 0)
  const paypalRevenue = completed.filter(s => s.type === "paypal").reduce((sum, s) => sum + s.price, 0)

  const filtered = filter === "all" ? sales : sales.filter(s => s.type === filter)

  return (
    <div>
      <div
        className="mb-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <h1 className="font-display text-2xl">All Sales</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1 flex items-center gap-1.5">
            <RobuxIcon size={12} /> Robux Revenue
          </p>
          <p className="text-xl font-mono font-bold text-[#fbbf24]">{robuxRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1 flex items-center gap-1.5">
            <PayPalIcon size={12} /> PayPal Revenue
          </p>
          <p className="text-xl font-mono font-bold text-[#67e8f9]">${paypalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">Total Orders</p>
          <p className="text-xl font-mono font-bold text-foreground">{sales.length}</p>
        </div>
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">Completed</p>
          <p className="text-xl font-mono font-bold text-[#67e8f9]">{completed.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "robux", "paypal"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-mono rounded-sm border transition-all ${
              filter === f
                ? "bg-[#eca8d6]/10 border-[#eca8d6]/40 text-[#eca8d6]"
                : "bg-transparent border-[oklch(0.18_0.008_260)] text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "robux" ? "Robux" : "PayPal"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No sales yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sale, i) => (
            <div
              key={sale.id}
              className="flex items-center gap-4 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4 transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transitionDelay: `${i * 30}ms` }}
            >
              <div className="shrink-0">
                {sale.type === "robux" ? <RobuxIcon size={16} /> : <PayPalIcon size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium text-foreground truncate">{sale.productName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {sale.buyerUsername} · {new Date(sale.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-mono text-sm font-bold ${sale.type === "robux" ? "text-[#fbbf24]" : "text-[#67e8f9]"}`}>
                  {sale.type === "robux" ? `${sale.price.toLocaleString()} R$` : `$${sale.price.toFixed(2)}`}
                </p>
                <p className={`text-[10px] font-mono ${
                  sale.status === "completed" ? "text-[#67e8f9]"
                  : sale.status === "pending" ? "text-[#fbbf24]"
                  : "text-muted-foreground"
                }`}>
                  {sale.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
