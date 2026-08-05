import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Rashi {
  _id: string
  name: string
  code: string
  mappedProductCount: number
  createdAt: string
  updatedAt: string
}

export interface RashiPayload {
  name: string
  code: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getRashis(): Promise<Rashi[]> {
  const res = await client.get('/api/v1/admin/rashis')
  return res.data.data.rashis as Rashi[]
}

export async function createRashi(data: RashiPayload): Promise<Rashi> {
  const res = await client.post('/api/v1/admin/rashis', data)
  return res.data.data.rashi as Rashi
}

export async function updateRashi(id: string, data: Partial<RashiPayload>): Promise<Rashi> {
  const res = await client.patch(`/api/v1/admin/rashis/${id}`, data)
  return res.data.data.rashi as Rashi
}

export async function deleteRashi(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/rashis/${id}`)
}
