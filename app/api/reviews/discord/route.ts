import { NextResponse } from "next/server"

export interface DiscordReview {
  id: string
  product: string
  rating: number // 1–5
  author: string
  comment: string
  postedAt: string
}

function parseRating(text: string): number {
  // Handles "⭐⭐⭐⭐⭐ (5/5)" or "★★★★☆ (4/5)" or just "5/5" or "4"
  const slash = text.match(/\((\d)\/5\)/)
  if (slash) return parseInt(slash[1])
  const lone = text.match(/^(\d)/)
  if (lone) return Math.min(5, Math.max(1, parseInt(lone[1])))
  // Count star emojis
  const stars = (text.match(/[⭐★]/g) || []).length
  return Math.min(5, Math.max(1, stars || 3))
}

function stripMention(text: string): string {
  // <@123456789> or <@!123456789> → strip, keep surrounding username if present
  return text.replace(/<@!?\d+>/g, "").replace(/^@/, "").trim() || "Anonymous"
}

function parseEmbed(embed: any, messageTimestamp: string): DiscordReview | null {
  const title: string = embed.title ?? ""
  const fields: { name: string; value: string }[] = embed.fields ?? []

  const field = (names: string[]) => {
    const f = fields.find(f => names.some(n => f.name.toLowerCase().includes(n.toLowerCase())))
    return f?.value?.trim() ?? ""
  }

  // ── Format A: "New Review — Product Name" (from lib/discord.ts notifyReview) ──
  if (title.toLowerCase().includes("new review")) {
    const product = title.replace(/new review\s*[—–-]+\s*/i, "").trim()
    const ratingRaw = field(["rating", "stars"])
    const buyer = field(["buyer"])
    const comment = field(["comment", "feedback", "review"])
    if (!product || !ratingRaw) return null
    return {
      id: embed.id ?? Math.random().toString(36),
      product,
      rating: parseRating(ratingRaw),
      author: stripMention(buyer) || "Anonymous",
      comment: comment || "",
      postedAt: messageTimestamp,
    }
  }

  // ── Format B: "New Product Feedback" (old bot format) ──
  if (title.toLowerCase().includes("feedback") || title.toLowerCase().includes("review")) {
    const product = field(["product", "item", "script"])
    const ratingRaw = field(["rating", "stars"])
    const author = field(["customer", "buyer", "user", "author"])
    const comment = field(["feedback", "comment", "review", "message"])
    if (!ratingRaw) return null
    return {
      id: embed.id ?? Math.random().toString(36),
      product: product || "Product",
      rating: parseRating(ratingRaw),
      author: stripMention(author) || "Anonymous",
      comment: comment || "",
      postedAt: messageTimestamp,
    }
  }

  return null
}

export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_REVIEWS_CHANNEL_ID

  if (!token || !channelId) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=50`,
      {
        headers: { Authorization: `Bot ${token}` },
        next: { revalidate: 300 }, // cache 5 minutes
      }
    )

    if (!res.ok) {
      console.error("[Discord reviews] fetch failed:", res.status, await res.text())
      return NextResponse.json([], { status: 200 })
    }

    const messages: any[] = await res.json()

    const reviews: DiscordReview[] = []
    for (const msg of messages) {
      for (const embed of msg.embeds ?? []) {
        const review = parseEmbed(embed, msg.timestamp)
        if (review) {
          review.id = msg.id
          // Only include reviews with a comment
          if (review.comment) reviews.push(review)
          break // one review per message
        }
      }
    }

    // Dedupe by message id, sort newest first, cap at 20
    const seen = new Set<string>()
    const unique = reviews.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    }).slice(0, 20)

    return NextResponse.json(unique, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (e) {
    console.error("[Discord reviews] error:", e)
    return NextResponse.json([])
  }
}
