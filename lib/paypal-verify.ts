// Verify a PayPal transaction via the PayPal REST API.
// Requires PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET env vars.
// Without them every call returns { verified: false, manual: true }
// so the payment falls back to manual seller approval.

const BASE =
  process.env.PAYPAL_SANDBOX === "true"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com"

async function getToken(): Promise<string | null> {
  const id = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!id || !secret) return null

  try {
    const res = await fetch(`${BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    })
    const data = await res.json()
    return (data.access_token as string) ?? null
  } catch {
    return null
  }
}

export interface VerifyResult {
  verified: boolean
  manual?: boolean // true = no API creds, fall back to manual
  error?: string
}

export async function verifyPayPalTransaction(
  transactionId: string,
  expectedAmount: number
): Promise<VerifyResult> {
  const token = await getToken()
  if (!token) return { verified: false, manual: true }

  try {
    const res = await fetch(
      `${BASE}/v1/reporting/transactions?transaction_id=${encodeURIComponent(transactionId)}&fields=transaction_info`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error("[PayPal verify]", res.status, err)
      return { verified: false, error: "Transaction not found — double-check your transaction ID." }
    }

    const data = await res.json()
    const details: any[] = data.transaction_details ?? []
    if (!details.length) {
      return { verified: false, error: "Transaction not found." }
    }

    const tx = details[0].transaction_info
    const txAmount = parseFloat(tx?.transaction_amount?.value ?? "0")

    // Allow a small tolerance for currency rounding
    if (txAmount < expectedAmount - 0.01) {
      return {
        verified: false,
        error: `Amount mismatch — expected $${expectedAmount.toFixed(2)}, transaction shows $${txAmount.toFixed(2)}.`,
      }
    }

    const txStatus = tx?.transaction_status ?? ""
    if (!["S", "V"].includes(txStatus)) {
      // S = Success, V = Reversal (treat as ok for now)
      return { verified: false, error: `Transaction status is not completed (status: ${txStatus}).` }
    }

    return { verified: true }
  } catch (e) {
    console.error("[PayPal verify] exception:", e)
    return { verified: false, error: "Verification failed — please try again or contact support." }
  }
}
