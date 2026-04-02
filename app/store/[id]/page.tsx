"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { SiteNav } from "@/components/shared/site-nav"
import { BuyModal } from "@/components/store/buy-modal"
import type { Product } from "@/lib/products"
import { computeSalePrice, extractYouTubeId } from "@/lib/utils-server"
import {
  Check, Zap, DollarSign, ArrowLeft, Tag, User, Loader2, ChevronLeft, ChevronRight, Play
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBuy, setShowBuy] = useState(false)
  const [visible, setVisible] = useState(false)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setProduct(data)
          setActiveMediaIndex(0)
          setTimeout(() => setVisible(true), 50)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] flex items-center justify-center">
        <SiteNav />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)]">
        <SiteNav />
        <div className="pt-32 text-center">
          <p className="font-mono text-muted-foreground">Product not found.</p>
          <Link href="/store" className="text-[#eca8d6] hover:underline text-sm mt-4 inline-block">
            Back to store
          </Link>
        </div>
      </div>
    )
  }

  const { robuxFinal, paypalFinal, hasDiscount } = computeSalePrice(product)
  const isFree = robuxFinal === 0 && !paypalFinal
  
  // Build media array: mainImage first, then galleryImages
  const allMedia: string[] = []
  if (product.mainImage) allMedia.push(product.mainImage)
  if (product.galleryImages) allMedia.push(...product.galleryImages)
  
  const activeMedia = allMedia[activeMediaIndex] ?? null
  const activeYoutubeId = activeMedia ? extractYouTubeId(activeMedia) : null
  
  const nextMedia = () => {
    if (allMedia.length > 1) {
      setActiveMediaIndex((prev) => (prev + 1) % allMedia.length)
    }
  }
  
  const prevMedia = () => {
    if (allMedia.length > 1) {
      setActiveMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
      <SiteNav />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        {/* Back */}
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: Image + Gallery */}
          <div
            className="lg:col-span-3 transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
          >
            {/* Main Media Display */}
            <div className="relative aspect-video bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm overflow-hidden mb-4 group">
              {activeYoutubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeYoutubeId}`}
                  title={product.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : activeMedia ? (
                <Image
                  src={activeMedia}
                  alt={product.name}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-display text-[oklch(0.18_0.008_260)]">
                    {product.name[0]}
                  </span>
                </div>
              )}
              
              {/* Navigation arrows */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allMedia.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === activeMediaIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail gallery */}
            {allMedia.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {allMedia.map((mediaUrl, idx) => {
                  const thumbYoutubeId = extractYouTubeId(mediaUrl)
                  const thumbnailSrc = thumbYoutubeId 
                    ? `https://img.youtube.com/vi/${thumbYoutubeId}/mqdefault.jpg`
                    : mediaUrl
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative flex-shrink-0 w-24 h-14 rounded-sm overflow-hidden border-2 transition-all ${idx === activeMediaIndex ? "border-[#eca8d6]" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <Image
                        src={thumbnailSrc}
                        alt={`${product.name} - ${idx + 1}`}
                        width={96}
                        height={54}
                        className="w-full h-full object-cover"
                      />
                      {thumbYoutubeId && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-4 h-4 text-white" fill="white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Description */}
            <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-6 mb-4">
              <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">Description</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-6">
                <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">Features</h2>
                <ul className="space-y-2">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-[#67e8f9] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Info + Buy */}
          <div
            className="lg:col-span-2 transition-all duration-700 delay-100"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider border border-[oklch(0.18_0.008_260)] px-2 py-0.5 rounded-sm">
                {product.category}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground border border-[oklch(0.18_0.008_260)] px-2 py-0.5 rounded-sm">
                {product.fileType}
              </span>
              {hasDiscount && (
                <span className="text-[10px] font-mono text-[#eca8d6] border border-[#eca8d6]/30 bg-[#eca8d6]/10 px-2 py-0.5 rounded-sm">
                  -{product.salePercent}% SALE
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl text-foreground mb-2">{product.name}</h1>

            {/* Creator */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 font-mono">
              <User className="w-3.5 h-3.5" />
              {product.creatorName}
            </div>

            {/* Pricing */}
            <div className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5 mb-4">
              {isFree ? (
                <span className="text-3xl font-mono font-bold text-[#67e8f9]">FREE</span>
              ) : (
                <div className="space-y-2">
                  {robuxFinal > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span className="flex items-center gap-1.5 text-3xl font-mono font-bold text-[#fbbf24]">
                        <Zap className="w-5 h-5" />
                        R${robuxFinal.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-muted-foreground line-through font-mono text-base">
                          R${product.robuxPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  {paypalFinal !== undefined && (
                    <div className="flex items-baseline gap-2">
                      <span className="flex items-center gap-1.5 text-xl font-mono font-bold text-[#67e8f9]">
                        <DollarSign className="w-4 h-4" />
                        ${paypalFinal.toFixed(2)}
                      </span>
                      {hasDiscount && product.paypalPrice && (
                        <span className="text-muted-foreground line-through font-mono text-sm">
                          ${product.paypalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">USD via PayPal</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buy button */}
            <button
              onClick={() => setShowBuy(true)}
              className="w-full py-3 bg-[#eca8d6]/20 border border-[#eca8d6]/40 text-[#eca8d6] font-mono font-bold rounded-sm hover:bg-[#eca8d6]/30 transition-all duration-200 mb-4"
            >
              {isFree ? "Get for Free" : "Buy Now"}
            </button>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-6">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-xs font-mono text-muted-foreground bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] px-2 py-0.5 rounded-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBuy && (
        <BuyModal product={product} onClose={() => setShowBuy(false)} />
      )}
    </div>
  )
}
