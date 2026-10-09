import client from './client'

export interface SubCategoryParent {
  _id: string
  name: string
  slug: string
}

export interface SubCategoryShipping {
  weight?: string
  length?: string
  breadth?: string
  height?: string
}

export interface SubCategory {
  _id: string
  name: string
  slug: string
  parentCategory: string | SubCategoryParent
  shipping?: SubCategoryShipping
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SubCategoryPayload {
  name: string
  slug?: string
  parentCategory: string
  shipping?: SubCategoryShipping
  isActive?: boolean
  sortOrder?: number
}

export async function getSubCategories(category?: string): Promise<SubCategory[]> {
  const res = await client.get('/api/v1/subcategories', { params: category ? { category } : undefined })
  return res.data.data.subcategories as SubCategory[]
}

export async function getAdminSubCategories(): Promise<SubCategory[]> {
  const res = await client.get('/api/v1/admin/subcategories')
  return res.data.data.subcategories as SubCategory[]
}

export async function createSubCategory(data: SubCategoryPayload): Promise<SubCategory> {
  const res = await client.post('/api/v1/admin/subcategories', data)
  return res.data.data.subcategory as SubCategory
}

export async function updateSubCategory(id: string, data: Partial<SubCategoryPayload>): Promise<SubCategory> {
  const res = await client.patch(`/api/v1/admin/subcategories/${id}`, data)
  return res.data.data.subcategory as SubCategory
}

export async function deleteSubCategory(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/subcategories/${id}`)
}
