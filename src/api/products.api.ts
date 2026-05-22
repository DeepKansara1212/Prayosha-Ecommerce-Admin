import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductCategory {
  _id: string
  name: string
  slug: string
}

export interface Product {
  _id: string
  name: string
  slug: string
  sku: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  images: string[]
  category: ProductCategory
  tags: string[]
  chakra?: string
  badge?: string
  stock: number
  lowStockThreshold: number
  weight?: number
  careInstructions?: string
  metaphysicalProperties?: string
  isFeatured: boolean
  isActive: boolean
  ratings: { average: number; count: number }
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ProductsResponse {
  products: Product[]
  pagination: Pagination
}

export interface ProductsParams {
  search?: string
  category?: string
  badge?: string
  page?: number
  limit?: number
}

export type ProductPayload = {
  name: string
  slug?: string
  sku: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  category: string
  tags?: string[]
  chakra?: string
  badge?: string
  stock: number
  lowStockThreshold?: number
  weight?: number
  careInstructions?: string
  metaphysicalProperties?: string
  isFeatured?: boolean
  isActive?: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getProducts(params?: ProductsParams): Promise<ProductsResponse> {
  const res = await client.get('/api/v1/products', { params })
  return res.data.data as ProductsResponse
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const res = await client.get(`/api/v1/products/${slug}`)
  return res.data.data.product as Product
}

export async function createProduct(data: ProductPayload): Promise<Product> {
  const res = await client.post('/api/v1/products', data)
  return res.data.data.product as Product
}

export async function updateProduct(id: string, data: Partial<ProductPayload>): Promise<Product> {
  const res = await client.patch(`/api/v1/products/${id}`, data)
  return res.data.data.product as Product
}

export async function deleteProduct(id: string): Promise<void> {
  await client.delete(`/api/v1/products/${id}`)
}

export async function uploadImages(id: string, files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append('images', f))
  const res = await client.post(`/api/v1/products/${id}/images`, form)
  return res.data.data.images as string[]
}

export async function deleteImage(id: string, imageUrl: string): Promise<string[]> {
  const res = await client.delete(`/api/v1/products/${id}/images`, {
    data: { imageUrl },
  })
  return res.data.data.images as string[]
}
