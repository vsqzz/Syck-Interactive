"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { X, Tag, Copy, Check, Loader2, AlertCircle } from "lucide-react"
import type { Product } from "@/lib/products"
import { computeSalePrice } from "@/lib/utils-server"
import { RobuxIcon } from "@/components/icons/robux-icon"
import { PayPalIcon } from "@/components/icons/paypal-icon"

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
  const [sellerPaypalEmail, setSellerPaypalEmail] = useState<string | null>(null)
  const [robuxStep, setRobuxStep] = useState<RobuxStep>("code")
  const [robuxCode, setRobuxCode] = useState<string | null>(null)
  const [confirmedRobuxPrice, setConfirmedRobuxPrice] = useState<number | null>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)

  useEffect(() => {
    if (product) {
      setTab(product.paypalPrice ? "robux" : "robux")
      setRobuxStep("code")
      setCouponCode("")
      setCouponResult(null)
      setError(null)
      setRobuxCode(null)
      setConfirmedRobuxPrice(null)
      setSellerPaypalEmail(null)
    }
  }, [product])

  // Fetch seller PayPal email when switching to PayPal tab
  useEffect(() => {
    if (tab === "paypal" && product && !sellerPaypalEmail) {
      fetch(`/api/products/${product.id}/seller`)
        .then(r => r.json())
        .then(data => { if (data.paypalEmail) setSellerPaypalEmail(data.paypalEmail) })
        .catch(() => {})
    }
  }, [tab, product, sellerPaypalEmail])

  if (!product) return null

  const { robuxFinal, paypalFinal, hasDiscount } = computeSalePrice(product)
  const finalRobux = couponResult?.valid ? Math.floor(couponResult.finalPrice ?? robuxFinal) : robuxFinal
  const finalPaypal = couponResult?.valid ? (couponResult.finalPrice ?? paypalFinal ?? product.paypalPrice) : (paypalFinal ?? product.paypalPrice)
  const isFree = finalRobux === 0 && !finalPaypal

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
      // Free product — granted immediately, no code needed
      if (data.free) {
        setAutoApproved(true)
        setRobuxStep("done")
        return
      }
      setRobuxCode(data.code)
      setConfirmedRobuxPrice(data.robuxPrice ?? null)
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
      setAutoApproved(data.autoApproved === true)
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
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-500/10 border border-green-500/30">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-display text-lg mb-2">
              {autoApproved ? "You're all set!" : "Submitted!"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {autoApproved
                ? <>Your file is ready to download —{" "}
                    <a href="/purchases" className="text-[#eca8d6] hover:underline">go to My Purchases</a>.</>
                : <>Your payment is being reviewed. Once approved, you can download from{" "}
                    <a href="/purchases" className="text-[#eca8d6] hover:underline">My Purchases</a>.</>
              }
            </p>
            <a href="/purchases" className="mt-6 w-full py-2 bg-[oklch(0.14_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm text-sm font-mono hover:bg-[oklch(0.18_0.008_260)] transition-colors block text-center">
              {autoApproved ? "Go to My Purchases" : "Close"}
            </a>
          </div>
        ) : robuxStep === "waiting" && robuxCode ? (
          // Robux code display
          <div className="p-6">
            <div className="mb-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Send exactly <span className="text-[#fbbf24] font-mono font-bold">R${(confirmedRobuxPrice ?? finalRobux).toLocaleString()}</span> Robux in-game and enter this code:
              </p>
              <div className="flex items-center gap-2 bg-[oklch(0.06_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-3 mb-2">
                <span className="flex-1 font-mono text-2xl tracking-[0.3em] text-foreground text-center">
                  {robuxCode}
                </span>
                <button onClick={copyCode} className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors">
                  {copied ? <Check className="w-4 h-4 text-[#67e8f9]" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60 font-mono">
                Code expires in 30 minutes. After payment, visit My Purchases.
              </p>
            </div>
            <a
              href="https://www.roblox.com/games/91093048274812/Payment-Hub"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 mb-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-mono text-sm font-bold rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              <RobuxIcon size={16} />
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-mono rounded-sm transition-all ${tab === "robux" ? "bg-[oklch(0.14_0.008_260)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <RobuxIcon size={16} /> Robux
                </button>
                <button
                  onClick={() => { setTab("paypal"); setCouponResult(null) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-mono rounded-sm transition-all ${tab === "paypal" ? "bg-[oklch(0.14_0.008_260)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <PayPalIcon size={16} /> PayPal
                </button>
              </div>
            )}

            {/* Price display */}
            <div className="mb-5 p-3 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.14_0.008_260)] rounded-sm">
              {tab === "robux" ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <RobuxIcon size={22} />
                  <span className="text-2xl font-mono font-bold text-[#fbbf24]">
                    {finalRobux.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through font-mono">
                      {product.robuxPrice.toLocaleString()}
                    </span>
                  )}
                  {couponResult?.valid && (
                    <span className="text-xs text-[#67e8f9] font-mono">
                      -{couponResult.discountAmount} coupon
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <PayPalIcon size={22} />
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

            {/* PayPal tab: seller email + instruction */}
            {tab === "paypal" && (
              <div className="mb-4 space-y-3">
                {sellerPaypalEmail ? (
                  <div className="p-3 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm">
                    <p className="text-xs text-muted-foreground font-mono mb-1">Send payment to:</p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-mono text-sm text-[#67e8f9]">{sellerPaypalEmail}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(sellerPaypalEmail)}
                        className="p-1.5 hover:bg-[oklch(0.14_0.008_260)] rounded-sm transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 font-mono">
                    Send <span className="text-[#67e8f9]">${typeof finalPaypal === "number" ? finalPaypal.toFixed(2) : "—"} USD</span> to the seller&apos;s PayPal, then paste your transaction ID below.
                  </p>
                )}
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
                Sign in with Discord to {isFree ? "Download" : "Buy"}
              </button>
            ) : tab === "robux" ? (
              <button
                onClick={handleRobuxBuy}
                disabled={loading}
                className={`w-full py-2.5 font-mono text-sm font-bold rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isFree ? "bg-[#67e8f9] hover:bg-[#22d3ee] text-black" : "bg-[#fbbf24] hover:bg-[#f59e0b] text-black"}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFree ? <Check className="w-4 h-4" /> : <RobuxIcon size={16} />)}
                {loading ? (isFree ? "Claiming..." : "Generating...") : (isFree ? "Get for Free" : `Buy with Robux — ${finalRobux.toLocaleString()}`)}
              </button>
            ) : (
              <button
                onClick={handlePaypalSubmit}
                disabled={loading}
                className="w-full py-2.5 bg-[#0070ba] hover:bg-[#005ea6] text-white font-mono text-sm font-bold rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PayPalIcon size={16} />}
                {loading ? "Verifying..." : `Submit PayPal — $${typeof finalPaypal === "number" ? finalPaypal.toFixed(2) : "—"}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
