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

export interface MappedRashiRef {
  _id: string
  name: string
  code: string
}

export interface RashiProductMapping {
  _id: string
  rashi: MappedRashiRef
  product: MappedProductRef
  priority: number
  active: boolean
}

export interface RashiProductMappingPayload {
  rashi: string
  product: string
  priority: number
  active: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getRashiProductMappings(
  params?: { rashi?: string; product?: string },
): Promise<RashiProductMapping[]> {
  const res = await client.get('/api/v1/admin/rashi-product-mappings', { params })
  return res.data.data.mappings as RashiProductMapping[]
}

export async function createRashiProductMapping(
  data: RashiProductMappingPayload,
): Promise<RashiProductMapping> {
  const res = await client.post('/api/v1/admin/rashi-product-mappings', data)
  return res.data.data.mapping as RashiProductMapping
}

export async function updateRashiProductMapping(
  id: string,
  data: Partial<RashiProductMappingPayload>,
): Promise<RashiProductMapping> {
  const res = await client.patch(`/api/v1/admin/rashi-product-mappings/${id}`, data)
  return res.data.data.mapping as RashiProductMapping
}

export async function deleteRashiProductMapping(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/rashi-product-mappings/${id}`)
}
