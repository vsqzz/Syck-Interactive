"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, TrendingUp, Zap, DollarSign } from "lucide-react"

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

export default function SalesPage() {
  const { data: session } = useSession()
  const [sales, setSales] = useState<SaleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function load() {
      if (!session?.user?.discordId) return
      try {
        const res = await fetch("/api/seller/sales")
        const data = await res.json()
        setSales(Array.isArray(data) ? data : [])
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      } catch {
        setLoading(false)
      }
    }
    load()
  }, [session])

  const paypalRevenue = sales
    .filter(s => s.type === "paypal" && s.status === "completed")
    .reduce((sum, s) => sum + s.price, 0)

  const robuxRevenue = sales
    .filter(s => s.type === "robux" && s.status === "completed")
    .reduce((sum, s) => sum + s.price, 0)

  return (
    <div>
      <div
        className="mb-8 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <h1 className="font-display text-2xl">Sales History</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5">
          <p className="text-xs font-mono text-muted-foreground mb-2">Robux Revenue</p>
          <p className="text-2xl font-mono font-bold text-[#fbbf24]">
            R${robuxRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5">
          <p className="text-xs font-mono text-muted-foreground mb-2">PayPal Revenue</p>
          <p className="text-2xl font-mono font-bold text-[#67e8f9]">
            ${paypalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5">
          <p className="text-xs font-mono text-muted-foreground mb-2">Total Orders</p>
          <p className="text-2xl font-mono font-bold text-foreground">{sales.length}</p>
        </div>
        <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5">
          <p className="text-xs font-mono text-muted-foreground mb-2">Completed</p>
          <p className="text-2xl font-mono font-bold text-foreground">
            {sales.filter(s => s.status === "completed").length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sales.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No sales yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((sale, i) => (
            <div
              key={sale.id}
              className="flex items-center gap-4 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4 transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transitionDelay: `${i * 50}ms`,
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-mono font-medium text-foreground">{sale.productName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {sale.buyerUsername} · {new Date(sale.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm font-bold ${sale.type === "robux" ? "text-[#fbbf24]" : "text-[#67e8f9]"}`}>
                  {sale.currency}{sale.type === "robux" ? sale.price.toLocaleString() : sale.price.toFixed(2)}
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
