import { readJsonFile, updateJsonFile } from "./storage"
import { nanoid } from "./nanoid"

const FILE = "data/paypal-payments.json"

export interface PayPalPayment {
  id: string
  productId: string
  productName: string
  buyerDiscordId: string
  buyerUsername: string
  sellerId: string
  paypalPrice: number
  transactionId: string
  status: "pending" | "completed" | "rejected"
  note?: string
  createdAt: string
}

export async function getAllPayPalPayments(): Promise<PayPalPayment[]> {
  const { data } = await readJsonFile<PayPalPayment[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getPayPalPaymentById(id: string): Promise<PayPalPayment | null> {
  const payments = await getAllPayPalPayments()
  return payments.find((p) => p.id === id) ?? null
}

export async function getPendingPayPalPayments(): Promise<PayPalPayment[]> {
  const payments = await getAllPayPalPayments()
  return payments.filter((p) => p.status === "pending")
}

export async function getPayPalPaymentsByBuyer(discordId: string): Promise<PayPalPayment[]> {
  const payments = await getAllPayPalPayments()
  return payments.filter((p) => p.buyerDiscordId === discordId)
}

export async function getPayPalPaymentsBySeller(sellerId: string): Promise<PayPalPayment[]> {
  const payments = await getAllPayPalPayments()
  return payments.filter((p) => p.sellerId === sellerId)
}

export async function createPayPalPayment(
  productId: string,
  productName: string,
  buyerDiscordId: string,
  buyerUsername: string,
  sellerId: string,
  paypalPrice: number,
  transactionId: string
): Promise<PayPalPayment> {
  const payment: PayPalPayment = {
    id: nanoid(),
    productId,
    productName,
    buyerDiscordId,
    buyerUsername,
    sellerId,
    paypalPrice,
    transactionId,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  await updateJsonFile<PayPalPayment[]>(FILE, (payments) => [...payments, payment])
  return payment
}

export async function approvePayPalPayment(id: string): Promise<void> {
  await updateJsonFile<PayPalPayment[]>(FILE, (payments) =>
    payments.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
  )
}

export async function rejectPayPalPayment(id: string, note?: string): Promise<void> {
  await updateJsonFile<PayPalPayment[]>(FILE, (payments) =>
    payments.map((p) => (p.id === id ? { ...p, status: "rejected", note } : p))
  )
}
