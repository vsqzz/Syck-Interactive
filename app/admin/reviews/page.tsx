"use client"

import { useEffect, useState } from "react"
import { Loader2, Star, MessageSquare } from "lucide-react"

interface Review {
  id: string
  productId: string
  productName: string
  buyerDiscordId: string
  buyerUsername: string
  sellerUsername: string
  rating: number
  comment: string
  createdAt: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then(r => r.json())
      .then(data => {
        setReviews(Array.isArray(data) ? data : [])
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [])

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <div>
          <h1 className="font-display text-2xl">Reviews</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {reviews.length} reviews · {avgRating.toFixed(1)}★ average
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <div
              key={review.id}
              className="bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-5 transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transitionDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-mono font-medium text-foreground">{review.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    by {review.buyerUsername} · {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= review.rating ? "text-[#fbbf24] fill-[#fbbf24]" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground/70 mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
