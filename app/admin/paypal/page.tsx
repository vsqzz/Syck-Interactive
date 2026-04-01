"use client"

import { useEffect, useState } from "react"
import { Check, X, Loader2, CreditCard, Clock, AlertCircle } from "lucide-react"

interface PayPalPayment {
  id: string
  productName: string
  buyerUsername: string
  buyerDiscordId: string
  paypalPrice: number
  transactionId: string
  status: "pending" | "completed" | "rejected"
  note?: string
  createdAt: string
}

export default function AdminPaypalPage() {
  const [payments, setPayments] = useState<PayPalPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [showAll, setShowAll] = useState(false)

  async function load(all = false) {
    setLoading(true)
    const res = await fetch(`/api/admin/paypal${all ? "?all=true" : ""}`)
    const data = await res.json()
    setPayments(Array.isArray(data) ? data : [])
    setLoading(false)
    setTimeout(() => setVisible(true), 50)
  }

  useEffect(() => { load(showAll) }, [showAll])

  async function approve(id: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/paypal/${id}/approve`, { method: "POST" })
      if (res.ok) {
        setPayments(p => p.map(x => x.id === id ? { ...x, status: "completed" } : x))
      }
    } finally {
      setActionId(null)
    }
  }

  async function reject(id: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/paypal/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote }),
      })
      if (res.ok) {
        setPayments(p => p.map(x => x.id === id ? { ...x, status: "rejected", note: rejectNote } : x))
        setRejectingId(null)
        setRejectNote("")
      }
    } finally {
      setActionId(null)
    }
  }

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <div>
          <h1 className="font-display text-2xl">PayPal Queue</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Review and approve buyer PayPal submissions
          </p>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? "Show pending only" : "Show all"}
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No {showAll ? "" : "pending "}payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment, i) => (
            <div
              key={payment.id}
              className={`bg-[oklch(0.09_0.008_260)] border rounded-sm p-5 transition-all duration-500 ${
                payment.status === "pending"
                  ? "border-[oklch(0.18_0.008_260)]"
                  : payment.status === "completed"
                  ? "border-[#67e8f9]/20 opacity-60"
                  : "border-destructive/20 opacity-60"
              }`}
              style={{
                opacity: visible ? (payment.status === "pending" ? 1 : 0.6) : 0,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-mono text-sm font-medium text-foreground">
                      {payment.productName}
                    </h3>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                      payment.status === "pending"
                        ? "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10"
                        : payment.status === "completed"
                        ? "text-[#67e8f9] border-[#67e8f9]/30 bg-[#67e8f9]/10"
                        : "text-destructive border-destructive/30 bg-destructive/10"
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground font-mono">
                    <p>Buyer: <span className="text-foreground/80">{payment.buyerUsername}</span></p>
                    <p>Amount: <span className="text-[#67e8f9]">${payment.paypalPrice.toFixed(2)}</span></p>
                    <p>TX ID: <span className="text-foreground/60 font-mono">{payment.transactionId}</span></p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                    {payment.note && (
                      <p className="text-destructive">Note: {payment.note}</p>
                    )}
                  </div>
                </div>

                {payment.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => approve(payment.id)}
                      disabled={actionId === payment.id}
                      className="flex items-center gap-2 px-4 py-2 bg-[#67e8f9]/10 border border-[#67e8f9]/30 text-[#67e8f9] text-sm font-mono rounded-sm hover:bg-[#67e8f9]/20 transition-colors disabled:opacity-50"
                    >
                      {actionId === payment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                    {rejectingId === payment.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={rejectNote}
                          onChange={e => setRejectNote(e.target.value)}
                          placeholder="Rejection reason..."
                          className="px-3 py-1.5 bg-[oklch(0.07_0.008_260)] border border-destructive/30 rounded-sm text-xs font-mono focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => reject(payment.id)}
                            disabled={actionId === payment.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono rounded-sm hover:bg-destructive/20 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectNote("") }}
                            className="flex-1 px-3 py-1.5 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] text-muted-foreground text-xs font-mono rounded-sm hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(payment.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-mono rounded-sm hover:bg-destructive/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
