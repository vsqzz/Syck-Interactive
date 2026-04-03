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

// Try to verify via the Orders API (v2/checkout/orders/{id})
async function tryOrdersApi(token: string, transactionId: string, expectedAmount: number): Promise<VerifyResult | null> {
  try {
    const res = await fetch(`${BASE}/v2/checkout/orders/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const order = await res.json()
    const status = order.status as string
    if (!["COMPLETED", "APPROVED"].includes(status)) {
      return { verified: false, error: `Order status is "${status}" — not completed yet.` }
    }
    const unit = order.purchase_units?.[0]
    const txAmount = parseFloat(unit?.amount?.value ?? "0")
    if (txAmount < expectedAmount - 0.01) {
      return { verified: false, error: `Amount mismatch — expected $${expectedAmount.toFixed(2)}, order shows $${txAmount.toFixed(2)}.` }
    }
    return { verified: true }
  } catch {
    return null
  }
}

// Try to verify via the Payments Captures API (v2/payments/captures/{id})
async function tryCapturesApi(token: string, transactionId: string, expectedAmount: number): Promise<VerifyResult | null> {
  try {
    const res = await fetch(`${BASE}/v2/payments/captures/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const capture = await res.json()
    const status = capture.status as string
    if (status !== "COMPLETED") {
      return { verified: false, error: `Capture status is "${status}" — not completed yet.` }
    }
    const txAmount = parseFloat(capture.amount?.value ?? "0")
    if (txAmount < expectedAmount - 0.01) {
      return { verified: false, error: `Amount mismatch — expected $${expectedAmount.toFixed(2)}, capture shows $${txAmount.toFixed(2)}.` }
    }
    return { verified: true }
  } catch {
    return null
  }
}

// Try via transaction search (requires Transaction Search permission on the PayPal app)
async function tryTransactionSearch(token: string, transactionId: string, expectedAmount: number): Promise<VerifyResult | null> {
  try {
    const res = await fetch(
      `${BASE}/v1/reporting/transactions?transaction_id=${encodeURIComponent(transactionId)}&fields=transaction_info`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const details: any[] = data.transaction_details ?? []
    if (!details.length) return null

    const tx = details[0].transaction_info
    const txAmount = parseFloat(tx?.transaction_amount?.value ?? "0")
    if (txAmount < expectedAmount - 0.01) {
      return { verified: false, error: `Amount mismatch — expected $${expectedAmount.toFixed(2)}, transaction shows $${txAmount.toFixed(2)}.` }
    }
    const txStatus = tx?.transaction_status ?? ""
    if (!["S", "V"].includes(txStatus)) {
      return { verified: false, error: `Transaction status is not completed (status: ${txStatus}).` }
    }
    return { verified: true }
  } catch {
    return null
  }
}

export async function verifyPayPalTransaction(
  transactionId: string,
  expectedAmount: number
): Promise<VerifyResult> {
  const token = await getToken()
  if (!token) return { verified: false, manual: true }

  // Try all three PayPal endpoints — different transaction ID formats work with different APIs
  const [orderResult, captureResult, searchResult] = await Promise.all([
    tryOrdersApi(token, transactionId, expectedAmount),
    tryCapturesApi(token, transactionId, expectedAmount),
    tryTransactionSearch(token, transactionId, expectedAmount),
  ])

  // Return the first successful verification
  if (orderResult?.verified) return orderResult
  if (captureResult?.verified) return captureResult
  if (searchResult?.verified) return searchResult

  // If any returned a definitive error, surface it
  const definitive = [orderResult, captureResult, searchResult].find(r => r && !r.verified && r.error)
  if (definitive) return definitive

  // Nothing found — may not exist yet or may take a few minutes to appear
  return {
    verified: false,
    error: "Transaction not found. Make sure you entered the correct transaction ID and that the payment has completed.",
  }
}
