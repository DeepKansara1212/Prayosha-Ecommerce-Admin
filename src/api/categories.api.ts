import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryShipping {
  weight: number
  length?: number
  breadth?: number
  height?: number
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  sortOrder: number
  shipping: CategoryShipping
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const res = await client.get('/api/v1/categories')
  return res.data.data.categories as Category[]
}

export async function getAdminCategories(): Promise<Category[]> {
  const res = await client.get('/api/v1/admin/categories')
  return res.data.data.categories as Category[]
}

export async function createCategory(data: FormData): Promise<Category> {
  const res = await client.post('/api/v1/categories', data)
  return res.data.data.category as Category
}

export async function updateCategory(id: string, data: FormData): Promise<Category> {
  const res = await client.patch(`/api/v1/categories/${id}`, data)
  return res.data.data.category as Category
}

export async function deleteCategory(id: string): Promise<void> {
  await client.delete(`/api/v1/categories/${id}`)
}
