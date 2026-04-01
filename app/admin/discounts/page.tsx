"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Tag, Loader2, Check, X, ToggleLeft, ToggleRight } from "lucide-react"

interface Coupon {
  code: string
  type: "percent" | "flat"
  value: number
  paymentMethod: "robux" | "paypal" | "both"
  scope: "all" | "product"
  productId?: string
  maxUses: number | null
  uses: number
  onePerUser: boolean
  expiresAt: string | null
  active: boolean
  createdBy: string
  createdAt: string
}

const defaultForm = {
  code: "",
  type: "percent" as "percent" | "flat",
  value: "",
  paymentMethod: "both" as "robux" | "paypal" | "both",
  scope: "all" as "all" | "product",
  productId: "",
  maxUses: "",
  onePerUser: false,
  expiresAt: "",
  active: true,
}

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const [actionCode, setActionCode] = useState<string | null>(null)

  async function loadCoupons() {
    const res = await fetch("/api/admin/discounts")
    const data = await res.json()
    setCoupons(Array.isArray(data) ? data : [])
    setLoading(false)
    setTimeout(() => setVisible(true), 50)
  }

  useEffect(() => { loadCoupons() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: parseFloat(form.value),
          paymentMethod: form.paymentMethod,
          scope: form.scope,
          productId: form.scope === "product" ? form.productId : undefined,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          onePerUser: form.onePerUser,
          expiresAt: form.expiresAt || null,
          active: form.active,
        }),
      })
      if (res.ok) {
        setForm(defaultForm)
        setShowForm(false)
        loadCoupons()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Delete coupon ${code}?`)) return
    setActionCode(code)
    try {
      await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", code }),
      })
      setCoupons(c => c.filter(x => x.code !== code))
    } finally {
      setActionCode(null)
    }
  }

  async function handleToggle(coupon: Coupon) {
    setActionCode(coupon.code)
    try {
      await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", code: coupon.code, active: !coupon.active }),
      })
      setCoupons(c => c.map(x => x.code === coupon.code ? { ...x, active: !x.active } : x))
    } finally {
      setActionCode(null)
    }
  }

  const inputClass = "w-full bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-[oklch(0.28_0.008_260)] transition-colors"

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <div>
          <h1 className="font-display text-2xl">Discounts & Coupons</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Create and manage discount codes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#eca8d6]/10 border border-[#eca8d6]/30 text-[#eca8d6] text-sm font-mono rounded-sm hover:bg-[#eca8d6]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5"
        >
          <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">New Coupon</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                placeholder="SAVE20"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className={inputClass}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Value *</label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                required
                placeholder={form.type === "percent" ? "20" : "100"}
                min="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as any }))} className={inputClass}>
                <option value="both">Both</option>
                <option value="robux">Robux only</option>
                <option value="paypal">PayPal only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Scope</label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value as any }))} className={inputClass}>
                <option value="all">All products</option>
                <option value="product">Specific product</option>
              </select>
            </div>
            {form.scope === "product" && (
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">Product ID</label>
                <input
                  type="text"
                  value={form.productId}
                  onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  placeholder="product-slug"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
                min="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-3 col-span-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, onePerUser: !f.onePerUser }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.onePerUser ? "bg-[#67e8f9]" : "bg-[oklch(0.18_0.008_260)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.onePerUser ? "translate-x-5" : ""}`} />
              </button>
              <label className="text-sm text-foreground/80 font-mono">One use per user</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#eca8d6]/20 border border-[#eca8d6]/40 text-[#eca8d6] font-mono text-sm rounded-sm hover:bg-[#eca8d6]/30 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Coupon
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] text-muted-foreground font-mono text-sm rounded-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No coupons yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((coupon, i) => (
            <div
              key={coupon.code}
              className={`flex items-center gap-4 bg-[oklch(0.09_0.008_260)] border rounded-sm p-4 transition-all duration-500 ${
                coupon.active ? "border-[oklch(0.18_0.008_260)]" : "border-[oklch(0.14_0.008_260)] opacity-50"
              }`}
              style={{
                opacity: visible ? (coupon.active ? 1 : 0.5) : 0,
                transitionDelay: `${i * 50}ms`,
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-foreground tracking-wider">{coupon.code}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                    coupon.active
                      ? "text-[#67e8f9] border-[#67e8f9]/30 bg-[#67e8f9]/10"
                      : "text-muted-foreground border-[oklch(0.18_0.008_260)]"
                  }`}>
                    {coupon.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {coupon.type === "percent" ? `${coupon.value}% off` : `${coupon.value} off`}
                  {" · "}{coupon.paymentMethod}
                  {" · "}{coupon.scope}
                  {" · "}{coupon.uses}/{coupon.maxUses ?? "∞"} used
                  {coupon.expiresAt && ` · expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(coupon)}
                  disabled={actionCode === coupon.code}
                  className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors text-muted-foreground hover:text-foreground"
                  title={coupon.active ? "Deactivate" : "Activate"}
                >
                  {actionCode === coupon.code ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : coupon.active ? (
                    <ToggleRight className="w-4 h-4 text-[#67e8f9]" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(coupon.code)}
                  disabled={actionCode === coupon.code}
                  className="p-1.5 hover:bg-destructive/10 rounded-sm transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
