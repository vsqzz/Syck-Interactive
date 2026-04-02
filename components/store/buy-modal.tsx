"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { X, Zap, DollarSign, Tag, Copy, Check, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import type { Product } from "@/lib/products"
import { computeSalePrice } from "@/lib/utils-server"

interface BuyModalProps {
  product: Product | null
  onClose: () => void
}

type Tab = "robux" | "paypal"
type RobuxStep = "code" | "waiting" | "done"

export function BuyModal({ product, onClose }: BuyModalProps) {
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>("robux")
  const [couponCode, setCouponCode] = useState("")
  const [couponResult, setCouponResult] = useState<{ valid?: boolean; error?: string; discountAmount?: number; finalPrice?: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [paypalTxId, setPaypalTxId] = useState("")
  const [robuxStep, setRobuxStep] = useState<RobuxStep>("code")
  const [robuxCode, setRobuxCode] = useState<string | null>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sellerPaypalEmail, setSellerPaypalEmail] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)

  useEffect(() => {
    if (product) {
      setTab(product.paypalPrice ? "robux" : "robux")
      setRobuxStep("code")
      setCouponCode("")
      setCouponResult(null)
      setError(null)
      setRobuxCode(null)
      setSellerPaypalEmail(null)
      
      // Fetch seller PayPal email for PayPal payments
      if (product.paypalPrice) {
        fetch(`/api/products/${product.id}/seller`)
          .then(r => r.json())
          .then(data => {
            if (data.paypalEmail) {
              setSellerPaypalEmail(data.paypalEmail)
            }
          })
          .catch(() => {})
      }
    }
  }, [product])

  if (!product) return null

  const { robuxFinal, paypalFinal, hasDiscount } = computeSalePrice(product)
  const finalRobux = couponResult?.valid ? Math.floor(couponResult.finalPrice ?? robuxFinal) : robuxFinal
  const finalPaypal = couponResult?.valid ? (couponResult.finalPrice ?? paypalFinal ?? product.paypalPrice) : (paypalFinal ?? product.paypalPrice)

  async function validateCoupon() {
    if (!couponCode.trim() || !product) return
    setCouponLoading(true)
    setCouponResult(null)
    try {
      const price = tab === "robux" ? robuxFinal : (paypalFinal ?? product.paypalPrice ?? 0)
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), productId: product.id, paymentMethod: tab, price }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, error: "Failed to validate coupon" })
    } finally {
      setCouponLoading(false)
    }
  }

  async function handleRobuxBuy() {
    if (!session) return signIn("discord")
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/buy/robux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product!.id,
          couponCode: couponResult?.valid ? couponCode.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRobuxCode(data.code)
      setPurchaseId(data.purchaseId)
      setRobuxStep("waiting")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePaypalSubmit() {
    if (!session) return signIn("discord")
    if (!paypalTxId.trim()) return setError("Please enter your PayPal transaction ID")
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/buy/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product!.id,
          transactionId: paypalTxId.trim(),
          couponCode: couponResult?.valid ? couponCode.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRobuxStep("done")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (robuxCode) {
      navigator.clipboard.writeText(robuxCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[oklch(0.18_0.008_260)]">
          <div>
            <h2 className="font-display text-xl text-foreground">{product.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{product.category} · {product.fileType}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {robuxStep === "done" ? (
          // Submitted (PayPal or waiting for approval)
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#67e8f9]/10 border border-[#67e8f9]/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-[#67e8f9]" />
            </div>
            <h3 className="font-display text-lg mb-2">Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              Your payment is being reviewed. Once approved, you can download from{" "}
              <a href="/purchases" className="text-[#eca8d6] hover:underline">My Purchases</a>.
            </p>
            <button onClick={onClose} className="mt-6 w-full py-2 bg-[oklch(0.14_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm text-sm font-mono hover:bg-[oklch(0.18_0.008_260)] transition-colors">
              Close
            </button>
          </div>
        ) : robuxStep === "waiting" && robuxCode ? (
          // Robux code display
          <div className="p-6">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Send exactly <span className="text-[#fbbf24] font-mono font-bold">R${finalRobux.toLocaleString()}</span> Robux in-game and enter this code:
              </p>
              <div className="flex items-center gap-2 bg-[oklch(0.06_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-3">
                <span className="flex-1 font-mono text-2xl tracking-[0.3em] text-foreground text-center">
                  {robuxCode}
                </span>
                <button onClick={copyCode} className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors">
                  {copied ? <Check className="w-4 h-4 text-[#67e8f9]" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                Code expires in 30 minutes. After payment, visit My Purchases.
              </p>
            </div>
            
            {/* Payment Hub Button */}
            <a
              href="https://www.roblox.com/games/91093048274812/Payment-Hub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mb-3 py-2.5 bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] font-mono text-sm font-bold rounded-sm hover:bg-[#fbbf24]/30 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Payment Hub in Roblox
            </a>
            
            <button onClick={onClose} className="w-full py-2 bg-[oklch(0.14_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm text-sm font-mono hover:bg-[oklch(0.18_0.008_260)] transition-colors">
              Got it
            </button>
          </div>
        ) : (
          <div className="p-5">
            {/* Tabs */}
            {product.paypalPrice && (
              <div className="flex mb-5 bg-[oklch(0.06_0.008_260)] rounded-sm border border-[oklch(0.18_0.008_260)] p-0.5">
                <button
                  onClick={() => { setTab("robux"); setCouponResult(null) }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-mono rounded-sm transition-all ${tab === "robux" ? "bg-[oklch(0.14_0.008_260)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Zap className="w-3.5 h-3.5" /> Robux
                </button>
                <button
                  onClick={() => { setTab("paypal"); setCouponResult(null) }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-mono rounded-sm transition-all ${tab === "paypal" ? "bg-[oklch(0.14_0.008_260)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> PayPal
                </button>
              </div>
            )}

            {/* Price display */}
            <div className="mb-5 p-3 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.14_0.008_260)] rounded-sm">
              {tab === "robux" ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#fbbf24]">
                    R${finalRobux.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through font-mono">
                      R${product.robuxPrice.toLocaleString()}
                    </span>
                  )}
                  {couponResult?.valid && (
                    <span className="text-xs text-[#67e8f9] font-mono">
                      -{couponResult.discountAmount} R$ coupon
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#67e8f9]">
                    ${typeof finalPaypal === "number" ? finalPaypal.toFixed(2) : "—"}
                  </span>
                  {hasDiscount && product.paypalPrice && (
                    <span className="text-sm text-muted-foreground line-through font-mono">
                      ${product.paypalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* PayPal tab: instruction */}
            {tab === "paypal" && (
              <div className="mb-4">
                {/* Seller PayPal Email */}
                {sellerPaypalEmail ? (
                  <div className="mb-3 p-3 bg-[oklch(0.07_0.008_260)] border border-[#67e8f9]/30 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1.5">Send payment to:</p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-mono text-sm text-[#67e8f9] break-all">
                        {sellerPaypalEmail}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sellerPaypalEmail)
                          setCopiedEmail(true)
                          setTimeout(() => setCopiedEmail(false), 2000)
                        }}
                        className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors shrink-0"
                      >
                        {copiedEmail ? <Check className="w-4 h-4 text-[#67e8f9]" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-sm">
                    <p className="text-xs text-destructive">Seller has not set up their PayPal email yet.</p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mb-2">
                  Send <span className="text-[#67e8f9] font-mono">${typeof finalPaypal === "number" ? finalPaypal.toFixed(2) : "—"} USD</span> to the PayPal above, then paste your transaction ID below.
                </p>
                <input
                  type="text"
                  value={paypalTxId}
                  onChange={e => setPaypalTxId(e.target.value)}
                  placeholder="PayPal Transaction ID (e.g. 1AB23456CD789)"
                  className="w-full bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-[oklch(0.28_0.008_260)] transition-colors"
                />
              </div>
            )}

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-3 py-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null) }}
                    placeholder="COUPON CODE"
                    className="flex-1 bg-transparent text-sm font-mono focus:outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <button
                  onClick={validateCoupon}
                  disabled={!couponCode.trim() || couponLoading}
                  className="px-3 py-2 bg-[oklch(0.14_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm text-sm font-mono hover:bg-[oklch(0.18_0.008_260)] transition-colors disabled:opacity-50"
                >
                  {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                </button>
              </div>
              {couponResult && (
                <p className={`text-xs mt-1.5 font-mono ${couponResult.valid ? "text-[#67e8f9]" : "text-destructive"}`}>
                  {couponResult.valid ? `✓ Coupon applied! Saving ${couponResult.discountAmount}` : `✗ ${couponResult.error}`}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Buy button */}
            {!session ? (
              <button
                onClick={() => signIn("discord")}
                className="w-full py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono text-sm rounded-sm transition-colors"
              >
                Sign in with Discord to Buy
              </button>
            ) : tab === "robux" ? (
              <button
                onClick={handleRobuxBuy}
                disabled={loading}
                className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-mono text-sm font-bold rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Generating..." : `Buy with Robux — R$${finalRobux.toLocaleString()}`}
              </button>
            ) : (
              <button
                onClick={handlePaypalSubmit}
                disabled={loading}
                className="w-full py-2.5 bg-[#0070ba] hover:bg-[#005ea6] text-white font-mono text-sm font-bold rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {loading ? "Submitting..." : `Submit PayPal — $${typeof finalPaypal === "number" ? finalPaypal.toFixed(2) : "—"}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
