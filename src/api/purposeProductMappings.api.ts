import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MappedProductRef {
  _id: string
  name: string
  images: string[]
  price: number
  isActive: boolean
  stock: number
}

export interface MappedPurposeRef {
  _id: string
  name: string
}

export interface PurposeProductMapping {
  _id: string
  purpose: MappedPurposeRef
  product: MappedProductRef
  priority: number
  active: boolean
}

export interface PurposeProductMappingPayload {
  purpose: string
  product: string
  priority: number
  active: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getPurposeProductMappings(
  params?: { purpose?: string; product?: string },
): Promise<PurposeProductMapping[]> {
  const res = await client.get('/api/v1/admin/purpose-product-mappings', { params })
  return res.data.data.mappings as PurposeProductMapping[]
}

export async function createPurposeProductMapping(
  data: PurposeProductMappingPayload,
): Promise<PurposeProductMapping> {
  const res = await client.post('/api/v1/admin/purpose-product-mappings', data)
  return res.data.data.mapping as PurposeProductMapping
}

export async function updatePurposeProductMapping(
  id: string,
  data: Partial<PurposeProductMappingPayload>,
): Promise<PurposeProductMapping> {
  const res = await client.patch(`/api/v1/admin/purpose-product-mappings/${id}`, data)
  return res.data.data.mapping as PurposeProductMapping
}

export async function deletePurposeProductMapping(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/purpose-product-mappings/${id}`)
}
