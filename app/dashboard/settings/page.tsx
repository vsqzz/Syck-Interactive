"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Check, AlertCircle, DollarSign } from "lucide-react"
import type { SellerProfile } from "@/lib/seller-profiles"

export default function SettingsPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [paypalEmail, setPaypalEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch("/api/seller/profile")
      .then(r => r.json())
      .then(data => {
        if (data) {
          setProfile(data)
          setPaypalEmail(data.paypalEmail ?? "")
        }
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalEmail }),
      })
      if (!res.ok) throw new Error("Failed to save")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div
        className="mb-8 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <h1 className="font-display text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your seller profile</p>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="max-w-lg space-y-6 transition-all duration-700 delay-100"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {/* Account info */}
          <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">Account</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Discord Username</p>
                <p className="text-sm font-mono text-foreground">{session?.user?.name}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">Discord ID</p>
                <p className="text-xs font-mono text-muted-foreground/60">{session?.user?.discordId}</p>
              </div>
              {profile?.registeredAt && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">Seller since</p>
                  <p className="text-xs font-mono text-muted-foreground/60">
                    {new Date(profile.registeredAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PayPal */}
          <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              PayPal Settings
            </h2>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                PayPal Email
              </label>
              <input
                type="email"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-[oklch(0.28_0.008_260)] transition-colors"
              />
              <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">
                Buyers will be directed to send PayPal payments to this email.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-[#67e8f9]/10 border border-[#67e8f9]/30 rounded-sm text-sm text-[#67e8f9]">
              <Check className="w-4 h-4" />
              Settings saved!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#eca8d6]/20 border border-[#eca8d6]/40 text-[#eca8d6] font-mono text-sm rounded-sm hover:bg-[#eca8d6]/30 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  )
}
