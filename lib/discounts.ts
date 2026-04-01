import { readJsonFile, updateJsonFile } from "./storage"

const FILE = "data/discounts.json"

export interface Coupon {
  code: string
  type: "percent" | "flat"
  value: number
  paymentMethod: "robux" | "paypal" | "both"
  scope: "all" | "product"
  productId?: string
  maxUses: number | null
  uses: number
  usedBy: string[]
  onePerUser: boolean
  expiresAt: string | null
  active: boolean
  createdBy: string
  createdAt: string
}

export interface CouponValidationResult {
  valid: boolean
  error?: string
  coupon?: Coupon
  discountAmount?: number
  finalPrice?: number
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const { data } = await readJsonFile<Coupon[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const coupons = await getAllCoupons()
  return coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null
}

export async function createCoupon(coupon: Coupon): Promise<void> {
  await updateJsonFile<Coupon[]>(FILE, (coupons) => [...coupons, coupon])
}

export async function deleteCoupon(code: string): Promise<void> {
  await updateJsonFile<Coupon[]>(FILE, (coupons) =>
    coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase())
  )
}

export async function toggleCoupon(code: string, active: boolean): Promise<void> {
  await updateJsonFile<Coupon[]>(FILE, (coupons) =>
    coupons.map((c) =>
      c.code.toUpperCase() === code.toUpperCase() ? { ...c, active } : c
    )
  )
}

export async function validateCoupon(
  code: string,
  productId: string,
  paymentMethod: "robux" | "paypal",
  price: number,
  userId: string
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code)

  if (!coupon) return { valid: false, error: "Coupon not found" }
  if (!coupon.active) return { valid: false, error: "Coupon is inactive" }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
    return { valid: false, error: "Coupon has expired" }
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses)
    return { valid: false, error: "Coupon has reached max uses" }
  if (coupon.onePerUser && coupon.usedBy.includes(userId))
    return { valid: false, error: "You have already used this coupon" }
  if (coupon.paymentMethod !== "both" && coupon.paymentMethod !== paymentMethod)
    return { valid: false, error: `This coupon only applies to ${coupon.paymentMethod} payments` }
  if (coupon.scope === "product" && coupon.productId !== productId)
    return { valid: false, error: "This coupon does not apply to this product" }

  let discountAmount: number
  if (coupon.type === "percent") {
    discountAmount = Math.floor(price * (coupon.value / 100))
  } else {
    discountAmount = Math.min(coupon.value, price)
  }

  const finalPrice = Math.max(0, price - discountAmount)
  return { valid: true, coupon, discountAmount, finalPrice }
}

export async function useCoupon(code: string, userId: string): Promise<void> {
  await updateJsonFile<Coupon[]>(FILE, (coupons) =>
    coupons.map((c) =>
      c.code.toUpperCase() === code.toUpperCase()
        ? {
            ...c,
            uses: c.uses + 1,
            usedBy: [...c.usedBy, userId],
          }
        : c
    )
  )
}
