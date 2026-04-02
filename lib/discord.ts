// Discord webhook notifications

interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
  url?: string
  thumbnail?: { url: string }
}

async function sendWebhook(url: string, content: string, embeds: DiscordEmbed[]) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds }),
    })
  } catch (e) {
    console.error("[Discord] Webhook failed:", e)
  }
}

function webhookUrl(key: "DISCORD_WEBHOOK_URL" | "DISCORD_SALES_WEBHOOK_URL" | "DISCORD_REVIEWS_WEBHOOK_URL") {
  return process.env[key] || process.env.DISCORD_WEBHOOK_URL || ""
}

export async function notifyNewProduct(product: {
  id: string
  name: string
  category: string
  robuxPrice: number
  paypalPrice?: number
  creatorName: string
  mainImage?: string
  description: string
}) {
  const url = webhookUrl("DISCORD_WEBHOOK_URL")
  if (!url) return

  const price = [
    product.robuxPrice > 0 ? `R$${product.robuxPrice.toLocaleString()}` : null,
    product.paypalPrice ? `$${product.paypalPrice.toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(" / ") || "FREE"

  await sendWebhook(url, "@everyone", [
    {
      title: `🆕 New Product — ${product.name}`,
      description: product.description.slice(0, 200) + (product.description.length > 200 ? "..." : ""),
      color: 0xeca8d6,
      fields: [
        { name: "Category", value: product.category, inline: true },
        { name: "Price", value: price, inline: true },
        { name: "Creator", value: product.creatorName, inline: true },
        { name: "Link", value: `[View on Syck Interactive](https://www.syckinteractive.space/store/${product.id})`, inline: false },
      ],
      thumbnail: product.mainImage ? { url: product.mainImage } : undefined,
      timestamp: new Date().toISOString(),
      footer: { text: "Syck Interactive" },
    },
  ])
}

export async function notifySale(data: {
  productName: string
  productId: string
  buyerUsername: string
  buyerDiscordId: string
  sellerUsername?: string
  amount: number
  method: "robux" | "paypal"
}) {
  const url = webhookUrl("DISCORD_SALES_WEBHOOK_URL")
  if (!url) return

  const isFree = data.amount === 0
  const priceDisplay = isFree
    ? "FREE"
    : data.method === "robux"
    ? `R$${data.amount.toLocaleString()}`
    : `$${data.amount.toFixed(2)}`

  const methodDisplay = isFree ? "Free" : data.method === "robux" ? "Robux" : "PayPal"
  const color = isFree ? 0x67e8f9 : data.method === "robux" ? 0xfbbf24 : 0x0070ba

  await sendWebhook(url, "", [
    {
      title: isFree ? "Free Product Claimed" : "New Sale",
      color,
      fields: [
        { name: "Product", value: `[${data.productName}](https://www.syckinteractive.space/store/${data.productId})`, inline: true },
        { name: "User", value: `@${data.buyerUsername}`, inline: true },
        { name: "Price", value: `${priceDisplay} (${methodDisplay})`, inline: true },
        ...(data.sellerUsername ? [{ name: "Seller", value: `@${data.sellerUsername}`, inline: true }] : []),
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `Discord ID: ${data.buyerDiscordId}` },
    },
  ])
}

export async function notifyReview(review: {
  productName: string
  productId: string
  buyerUsername: string
  sellerUsername: string
  rating: number
  comment: string
  createdAt: string
}) {
  const url = webhookUrl("DISCORD_REVIEWS_WEBHOOK_URL")
  if (!url) return

  const stars = "⭐".repeat(review.rating) + "☆".repeat(5 - review.rating)

  await sendWebhook(url, "", [
    {
      title: `New Review — ${review.productName}`,
      color: 0xfbbf24,
      fields: [
        { name: "Rating", value: `${stars} (${review.rating}/5)`, inline: true },
        { name: "Buyer", value: `@${review.buyerUsername}`, inline: true },
        { name: "Seller", value: `@${review.sellerUsername}`, inline: true },
        { name: "Comment", value: review.comment || "*(no comment)*", inline: false },
        {
          name: "Product",
          value: `[View product](https://www.syckinteractive.space/store/${review.productId})`,
          inline: false,
        },
      ],
      timestamp: review.createdAt,
      footer: { text: "Syck Interactive Reviews" },
    },
  ])
}
