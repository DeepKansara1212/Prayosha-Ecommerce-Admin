import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Purpose {
  _id: string
  name: string
  active: boolean
  mappedRudrakshaCount: number
  createdAt: string
  updatedAt: string
}

export interface PurposePayload {
  name: string
  active: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getPurposes(): Promise<Purpose[]> {
  const res = await client.get('/api/v1/admin/purposes')
  return res.data.data.purposes as Purpose[]
}

export async function createPurpose(data: PurposePayload): Promise<Purpose> {
  const res = await client.post('/api/v1/admin/purposes', data)
  return res.data.data.purpose as Purpose
}

export async function updatePurpose(id: string, data: Partial<PurposePayload>): Promise<Purpose> {
  const res = await client.patch(`/api/v1/admin/purposes/${id}`, data)
  return res.data.data.purpose as Purpose
}

export async function deletePurpose(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/purposes/${id}`)
}
