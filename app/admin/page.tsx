"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, CreditCard, Tag, ArrowRight, Loader2 } from "lucide-react"

export default function AdminPage() {
  const [stats, setStats] = useState({
    products: 0,
    pendingPaypal: 0,
    coupons: 0,
  })
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products").then(r => r.json()),
      fetch("/api/admin/paypal").then(r => r.json()),
      fetch("/api/admin/discounts").then(r => r.json()),
    ])
      .then(([products, paypal, discounts]) => {
        setStats({
          products: Array.isArray(products) ? products.length : 0,
          pendingPaypal: Array.isArray(paypal) ? paypal.length : 0,
          coupons: Array.isArray(discounts) ? discounts.length : 0,
        })
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [])

  const cards = [
    { label: "Total Products", value: stats.products, icon: Package, color: "#eca8d6", href: "/admin" },
    { label: "Pending PayPal", value: stats.pendingPaypal, icon: CreditCard, color: "#fbbf24", href: "/admin/paypal" },
    { label: "Active Coupons", value: stats.coupons, icon: Tag, color: "#67e8f9", href: "/admin/discounts" },
  ]

  return (
    <div>
      <div
        className="mb-8 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <p className="font-mono text-xs text-[#eca8d6] uppercase tracking-wider mb-1">Admin Panel</p>
        <h1 className="font-display text-3xl">Overview</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <Link
            key={card.label}
            href={card.href}
            className="block bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5 hover:border-[oklch(0.28_0.008_260)] transition-all group hover-lift"
            style={{
              opacity: visible ? 1 : 0,
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

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 delay-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <Link
          href="/admin/paypal"
          className="p-5 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm hover:border-[#fbbf24]/30 transition-all group"
        >
          <h3 className="font-mono text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#fbbf24]" />
            Review PayPal Payments
          </h3>
          <p className="text-xs text-muted-foreground">
            Approve or reject pending PayPal transactions from buyers.
          </p>
        </Link>
        <Link
          href="/admin/discounts"
          className="p-5 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm hover:border-[#67e8f9]/30 transition-all group"
        >
          <h3 className="font-mono text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#67e8f9]" />
            Manage Discounts
          </h3>
          <p className="text-xs text-muted-foreground">
            Create and manage coupon codes and sitewide sales.
          </p>
        </Link>
      </div>
    </div>
  )
}
