"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Package, TrendingUp, DollarSign, Zap, Plus, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    productCount: 0,
    totalRobuxSales: 0,
    totalPaypalSales: 0,
    totalOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, salesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/seller/sales"),
        ])
        const products = await productsRes.json()
        const sales = await salesRes.json()
        
        const myProducts = Array.isArray(products)
          ? products.filter((p: any) => p.creatorId === session?.user?.discordId)
          : []
        
        const salesArray = Array.isArray(sales) ? sales : []
        const completedSales = salesArray.filter((s: any) => s.status === "completed")
        
        const robuxRevenue = completedSales
          .filter((s: any) => s.type === "robux")
          .reduce((sum: number, s: any) => sum + s.price, 0)
        
        const paypalRevenue = completedSales
          .filter((s: any) => s.type === "paypal")
          .reduce((sum: number, s: any) => sum + s.price, 0)
        
        setStats({
          productCount: myProducts.length,
          totalOrders: salesArray.length,
          totalRobuxSales: robuxRevenue,
          totalPaypalSales: paypalRevenue,
        })
      } catch {}
      setLoading(false)
      setTimeout(() => setVisible(true), 50)
    }
    if (session) load()
  }, [session])

  const statCards = [
    {
      label: "My Products",
      value: stats.productCount,
      icon: Package,
      color: "#eca8d6",
      href: "/dashboard/products",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: TrendingUp,
      color: "#a78bfa",
      href: "/dashboard/sales",
    },
    {
      label: "Robux Revenue",
      value: `R$${stats.totalRobuxSales.toLocaleString()}`,
      icon: Zap,
      color: "#fbbf24",
      href: "/dashboard/sales",
    },
    {
      label: "PayPal Revenue",
      value: `$${stats.totalPaypalSales.toFixed(2)}`,
      icon: DollarSign,
      color: "#67e8f9",
      href: "/dashboard/sales",
    },
  ]

  return (
    <div>
      <div
        className="mb-8 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Welcome back
        </p>
        <h1 className="font-display text-3xl text-foreground">
          {session?.user?.name ?? "Seller"}&apos;s Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <Link
            key={card.label}
            href={card.href}
            className="block bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5 hover:border-[oklch(0.28_0.008_260)] transition-all duration-300 hover-lift group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transitionDelay: `${i * 80}ms`,
              transition: `opacity 0.5s ${i * 80}ms, transform 0.5s ${i * 80}ms`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20`, border: `1px solid ${card.color}40` }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-2xl font-mono font-bold text-foreground mb-1">
              {loading ? "—" : card.value}
            </p>
            <p className="text-xs font-mono text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 delay-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-4 p-5 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm hover:border-[#eca8d6]/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-sm bg-[#eca8d6]/10 border border-[#eca8d6]/30 flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#eca8d6]" />
          </div>
          <div>
            <p className="text-sm font-mono text-foreground font-medium">Create Product</p>
            <p className="text-xs text-muted-foreground">List a new Roblox product</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#eca8d6] ml-auto transition-colors" />
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-4 p-5 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm hover:border-[#67e8f9]/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-sm bg-[#67e8f9]/10 border border-[#67e8f9]/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#67e8f9]" />
          </div>
          <div>
            <p className="text-sm font-mono text-foreground font-medium">PayPal Setup</p>
            <p className="text-xs text-muted-foreground">Add your PayPal email</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#67e8f9] ml-auto transition-colors" />
        </Link>
      </div>
    </div>
  )
}
