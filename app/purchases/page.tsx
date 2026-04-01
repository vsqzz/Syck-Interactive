"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { SiteNav } from "@/components/shared/site-nav"
import { Download, Zap, DollarSign, Loader2, Clock, AlertCircle, Check } from "lucide-react"
import Link from "next/link"

interface PurchaseEntry {
  type: "robux" | "paypal"
  id: string
  productId: string
  productName: string
  price: number
  currency: string
  status: string
  createdAt: string
  downloadRecord: {
    id: string
    downloadCount: number
    maxDownloads: number
    lastDownloadAt?: string
  } | null
}

export default function PurchasesPage() {
  const { data: session, status } = useSession()
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<{ [id: string]: string }>({})
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (session) {
      fetch("/api/purchases")
        .then(r => r.json())
        .then(data => {
          setPurchases(Array.isArray(data) ? data : [])
          setLoading(false)
          setTimeout(() => setVisible(true), 50)
        })
        .catch(() => setLoading(false))
    } else if (status !== "loading") {
      setLoading(false)
    }
  }, [session, status])

  async function handleDownload(record: PurchaseEntry["downloadRecord"], purchaseName: string) {
    if (!record) return
    setDownloadingId(record.id)
    setDownloadError(e => ({ ...e, [record.id]: "" }))
    try {
      const res = await fetch(`/api/purchases/${record.id}/download`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Update local state
      setPurchases(prev =>
        prev.map(p =>
          p.downloadRecord?.id === record.id
            ? { ...p, downloadRecord: { ...p.downloadRecord!, downloadCount: data.downloadsUsed } }
            : p
        )
      )
      // Trigger download
      const a = document.createElement("a")
      a.href = data.url
      a.download = purchaseName
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e: any) {
      setDownloadError(err => ({ ...err, [record.id]: e.message }))
    } finally {
      setDownloadingId(null)
    }
  }

  if (status === "loading" || (status !== "unauthenticated" && loading)) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] flex items-center justify-center">
        <SiteNav />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
        <SiteNav />
        <div className="pt-32 flex flex-col items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] flex items-center justify-center mx-auto mb-6">
              <Download className="w-5 h-5 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl mb-3">Sign in to view purchases</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Access your purchase history and download your files.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="w-full py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono text-sm rounded-sm transition-colors"
            >
              Sign in with Discord
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
      <SiteNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-24">
        <div
          className="mb-10 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">Account</p>
          <h1 className="font-display text-4xl">My <span className="word-gradient">Purchases</span></h1>
        </div>

        {purchases.length === 0 ? (
          <div
            className="text-center py-24 transition-all duration-700 delay-100"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <p className="text-muted-foreground font-mono text-sm mb-4">No completed purchases yet.</p>
            <Link href="/store" className="text-[#eca8d6] hover:underline text-sm font-mono">
              Browse the store →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((p, i) => {
              const dl = p.downloadRecord
              const canDownload = dl && dl.downloadCount < dl.maxDownloads
              const errMsg = dl ? downloadError[dl.id] : undefined

              return (
                <div
                  key={p.id}
                  className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-500"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(16px)",
                    transitionDelay: `${100 + i * 60}ms`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg text-foreground truncate">
                        {p.productName}
                      </h3>
                      <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                        p.type === "robux"
                          ? "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10"
                          : "text-[#67e8f9] border-[#67e8f9]/30 bg-[#67e8f9]/10"
                      }`}>
                        {p.type === "robux" ? `R$${p.price.toLocaleString()}` : `$${p.price.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      {dl && (
                        <span className={`flex items-center gap-1 ${dl.downloadCount >= dl.maxDownloads ? "text-destructive" : ""}`}>
                          <Download className="w-3 h-3" />
                          {dl.downloadCount}/{dl.maxDownloads} downloads used
                        </span>
                      )}
                    </div>
                    {errMsg && (
                      <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errMsg}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/store/${p.productId}`}
                      className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View product
                    </Link>
                    {dl ? (
                      <button
                        onClick={() => handleDownload(dl, p.productName)}
                        disabled={!canDownload || downloadingId === dl.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-sm transition-all ${
                          canDownload
                            ? "bg-[#eca8d6]/20 border border-[#eca8d6]/40 text-[#eca8d6] hover:bg-[#eca8d6]/30"
                            : "bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] text-muted-foreground cursor-not-allowed opacity-50"
                        }`}
                      >
                        {downloadingId === dl.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        {dl.downloadCount >= dl.maxDownloads ? "Limit Reached" : "Download"}
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground/50 px-4 py-2">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
