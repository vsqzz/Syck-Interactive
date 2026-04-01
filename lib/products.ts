import { readJsonFile, updateJsonFile, writeJsonFile } from "./storage"

const FILE = "data/products.json"

export interface Product {
  id: string
  name: string
  description: string
  category: string
  fileType: string
  features: string[]
  robuxPrice: number
  paypalPrice?: number
  cryptoPrice?: number
  mainImage?: string
  galleryImages?: string[]
  tags?: string[]
  downloadUrl: string
  creatorId: string
  creatorName: string
  salePercent?: number
  active: boolean
  createdAt: string
}

export async function getAllProducts(): Promise<Product[]> {
  const { data } = await readJsonFile<Product[]>(FILE)
  return Array.isArray(data) ? data : []
}

export async function getActiveProducts(): Promise<Product[]> {
  const products = await getAllProducts()
  return products.filter((p) => p.active)
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getAllProducts()
  return products.find((p) => p.id === id) ?? null
}

export async function createProduct(product: Product): Promise<void> {
  await updateJsonFile<Product[]>(FILE, (products) => {
    return [...products, product]
  })
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  await updateJsonFile<Product[]>(FILE, (products) => {
    return products.map((p) => (p.id === id ? { ...p, ...updates } : p))
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await updateJsonFile<Product[]>(FILE, (products) => {
    return products.filter((p) => p.id !== id)
  })
}

export async function getProductsByCreator(creatorId: string): Promise<Product[]> {
  const products = await getAllProducts()
  return products.filter((p) => p.creatorId === creatorId)
}
