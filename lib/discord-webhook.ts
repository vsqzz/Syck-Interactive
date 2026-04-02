/**
 * Discord webhook utility for sending notifications
 */

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  timestamp?: string
  footer?: {
    text: string
  }
}

interface DiscordWebhookPayload {
  content?: string
  embeds?: DiscordEmbed[]
  username?: string
  avatar_url?: string
}

export async function sendDiscordNotification(payload: DiscordWebhookPayload): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.log("[v0] Discord webhook URL not configured, skipping notification")
    return false
  }

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error("[v0] Discord webhook failed:", res.status, await res.text())
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Discord webhook error:", error)
    return false
  }
}

export async function notifyNewPayPalOrder(
  productName: string,
  buyerUsername: string,
  amount: number,
  transactionId: string
): Promise<boolean> {
  return sendDiscordNotification({
    username: "Syck Store",
    embeds: [
      {
        title: "New PayPal Order Pending",
        description: "A new PayPal payment has been submitted and needs your approval.",
        color: 0x0070ba, // PayPal blue
        fields: [
          {
            name: "Product",
            value: productName,
            inline: true,
          },
          {
            name: "Buyer",
            value: buyerUsername,
            inline: true,
          },
          {
            name: "Amount",
            value: `$${amount.toFixed(2)} USD`,
            inline: true,
          },
          {
            name: "Transaction ID",
            value: `\`${transactionId}\``,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Go to Admin Panel > PayPal Queue to approve or reject",
        },
      },
    ],
  })
}

export async function notifyRobuxPaymentCompleted(
  productName: string,
  buyerUsername: string,
  amount: number
): Promise<boolean> {
  return sendDiscordNotification({
    username: "Syck Store",
    embeds: [
      {
        title: "Robux Payment Completed",
        description: "A Robux payment has been verified and completed.",
        color: 0xfbbf24, // Robux gold
        fields: [
          {
            name: "Product",
            value: productName,
            inline: true,
          },
          {
            name: "Buyer",
            value: buyerUsername,
            inline: true,
          },
          {
            name: "Amount",
            value: `R$${amount.toLocaleString()}`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  })
}
