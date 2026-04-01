"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Minus, AlertCircle, Check } from "lucide-react"
import type { Product } from "@/lib/products"

interface ProductFormProps {
  product?: Partial<Product>
  isEdit?: boolean
}

const CATEGORIES = [
  "Admin Systems", "Combat Systems", "UI Frameworks", "Minigames",
  "Tools & Utilities", "Animation Packs", "Vehicle Systems", "Economy Systems",
  "Social Systems", "Other",
]

const FILE_TYPES = [".rbxm", ".rbxmx", ".lua", ".rbxl", ".rbxlx", ".zip", ".model", "other"]

export function ProductForm({ product, isEdit }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? CATEGORIES[0],
    fileType: product?.fileType ?? FILE_TYPES[0],
    features: product?.features ?? [""],
    robuxPrice: product?.robuxPrice?.toString() ?? "0",
    paypalPrice: product?.paypalPrice?.toString() ?? "",
    mainImage: product?.mainImage ?? "",
    downloadUrl: product?.downloadUrl ?? "",
    salePercent: product?.salePercent?.toString() ?? "",
    tags: product?.tags?.join(", ") ?? "",
    active: product?.active ?? true,
  })

  function updateFeature(index: number, value: string) {
    const updated = [...form.features]
    updated[index] = value
    setForm(f => ({ ...f, features: updated }))
  }

  function addFeature() {
    setForm(f => ({ ...f, features: [...f.features, ""] }))
  }

  function removeFeature(index: number) {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      fileType: form.fileType,
      features: form.features.filter(Boolean),
      robuxPrice: parseInt(form.robuxPrice) || 0,
      paypalPrice: form.paypalPrice ? parseFloat(form.paypalPrice) : undefined,
      mainImage: form.mainImage || undefined,
      downloadUrl: form.downloadUrl,
      salePercent: form.salePercent ? parseInt(form.salePercent) : undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      active: form.active,
    }

    try {
      let res: Response
      if (isEdit && product?.id) {
        res = await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(true)
      setTimeout(() => router.push("/dashboard/products"), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-[oklch(0.28_0.008_260)] transition-colors placeholder:text-muted-foreground/40"
  const labelClass = "block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-[#67e8f9]/10 border border-[#67e8f9]/30 rounded-sm text-sm text-[#67e8f9]">
          <Check className="w-4 h-4 shrink-0" />
          {isEdit ? "Product updated!" : "Product created!"} Redirecting...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="md:col-span-2">
          <label className={labelClass}>Product Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            placeholder="e.g. Advanced Admin System"
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>Description *</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
            rows={4}
            placeholder="Describe your product..."
            className={inputClass + " resize-none"}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category *</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className={inputClass}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* File Type */}
        <div>
          <label className={labelClass}>File Type *</label>
          <select
            value={form.fileType}
            onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
            className={inputClass}
          >
            {FILE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Robux Price */}
        <div>
          <label className={labelClass}>Robux Price (0 = free)</label>
          <input
            type="number"
            min="0"
            value={form.robuxPrice}
            onChange={e => setForm(f => ({ ...f, robuxPrice: e.target.value }))}
            className={inputClass}
          />
        </div>

        {/* PayPal Price */}
        <div>
          <label className={labelClass}>PayPal Price USD (optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.paypalPrice}
            onChange={e => setForm(f => ({ ...f, paypalPrice: e.target.value }))}
            placeholder="e.g. 9.99"
            className={inputClass}
          />
        </div>

        {/* Sale Percent */}
        <div>
          <label className={labelClass}>Sale % (optional)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.salePercent}
            onChange={e => setForm(f => ({ ...f, salePercent: e.target.value }))}
            placeholder="e.g. 20"
            className={inputClass}
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-3 pt-5">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? "bg-[#67e8f9]" : "bg-[oklch(0.18_0.008_260)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? "translate-x-5" : ""}`} />
          </button>
          <label className="text-sm text-foreground/80">Active (visible in store)</label>
        </div>

        {/* Main Image URL */}
        <div className="md:col-span-2">
          <label className={labelClass}>Main Image URL (optional)</label>
          <input
            type="url"
            value={form.mainImage}
            onChange={e => setForm(f => ({ ...f, mainImage: e.target.value }))}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        {/* Download URL */}
        <div className="md:col-span-2">
          <label className={labelClass}>Download URL *</label>
          <input
            type="url"
            value={form.downloadUrl}
            onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
            required
            placeholder="https://github.com/... or direct link"
            className={inputClass}
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="admin, gui, open-source"
            className={inputClass}
          />
        </div>

        {/* Features */}
        <div className="md:col-span-2">
          <label className={labelClass}>Features</label>
          <div className="space-y-2">
            {form.features.map((feature, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={e => updateFeature(i, e.target.value)}
                  placeholder={`Feature ${i + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="p-2 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm hover:border-destructive/40 hover:text-destructive transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add feature
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || success}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#eca8d6]/20 border border-[#eca8d6]/40 text-[#eca8d6] font-mono text-sm rounded-sm hover:bg-[#eca8d6]/30 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] text-muted-foreground font-mono text-sm rounded-sm hover:text-foreground hover:border-[oklch(0.28_0.008_260)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
