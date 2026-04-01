"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Tag, Zap, DollarSign } from "lucide-react"
import type { Product } from "@/lib/products"
import { computeSalePrice } from "@/lib/utils-server"

interface ProductCardProps {
  product: Product
  onBuy?: (product: Product) => void
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const { robuxFinal, paypalFinal, hasDiscount } = computeSalePrice(product)
  const isFree = robuxFinal === 0 && !paypalFinal

  return (
    <div className="group hover-lift relative bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm overflow-hidden transition-all duration-300 hover:border-[oklch(0.28_0.008_260)]">
      {/* Sale badge */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[#eca8d6]/20 border border-[#eca8d6]/40 rounded-sm text-[#eca8d6] text-xs font-mono">
          -{product.salePercent}% OFF
        </div>
      )}

      {/* Image */}
      <Link href={`/store/${product.id}`} className="block aspect-video overflow-hidden bg-[oklch(0.07_0.008_260)]">
        {product.mainImage ? (
          <Image
            src={product.mainImage}
            alt={product.name}
            width={400}
            height={225}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl font-display text-[oklch(0.18_0.008_260)] opacity-50">
              {product.name[0]}
            </div>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider border border-[oklch(0.18_0.008_260)] px-1.5 py-0.5 rounded-sm">
            {product.category}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {product.fileType}
          </span>
        </div>

        {/* Name */}
        <Link href={`/store/${product.id}`}>
          <h3 className="font-display text-lg text-foreground hover:text-[#eca8d6] transition-colors mb-1 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {product.description}
        </p>

        {/* Creator */}
        <p className="text-xs text-muted-foreground/60 mb-3 font-mono">
          by {product.creatorName}
        </p>

        {/* Price + Buy */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {isFree ? (
              <span className="text-[#67e8f9] font-mono text-sm font-medium">FREE</span>
            ) : (
              <div className="flex items-center gap-2">
                {robuxFinal > 0 && (
                  <span className="flex items-center gap-1 text-[#fbbf24] font-mono text-sm font-medium">
                    <Zap className="w-3 h-3" />
                    R${robuxFinal.toLocaleString()}
                  </span>
                )}
                {paypalFinal !== undefined && robuxFinal > 0 && (
                  <span className="text-muted-foreground/40 text-xs">or</span>
                )}
                {paypalFinal !== undefined && (
                  <span className="flex items-center gap-1 text-[#67e8f9] font-mono text-sm font-medium">
                    <DollarSign className="w-3 h-3" />
                    ${paypalFinal.toFixed(2)}
                  </span>
                )}
              </div>
            )}
            {hasDiscount && !isFree && (
              <span className="text-xs text-muted-foreground/50 line-through font-mono">
                R${product.robuxPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={() => onBuy?.(product)}
            className="px-3 py-1.5 bg-[oklch(0.14_0.008_260)] hover:bg-[oklch(0.18_0.008_260)] border border-[oklch(0.18_0.008_260)] hover:border-[#eca8d6]/40 text-sm text-foreground/80 hover:text-foreground rounded-sm transition-all duration-200 font-mono"
          >
            {isFree ? "Get Free" : "Buy"}
          </button>
        </div>
      </div>
    </div>
  )
}
