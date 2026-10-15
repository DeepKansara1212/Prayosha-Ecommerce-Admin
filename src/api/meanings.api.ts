import client from './client'

export interface Meaning {
  _id: string
  name: string
  active: boolean
  mappedProductCount: number
  createdAt: string
  updatedAt: string
}

export interface MeaningPayload {
  name: string
  active: boolean
}

export async function getMeanings(): Promise<Meaning[]> {
  const res = await client.get('/api/v1/admin/meanings')
  return res.data.data.meanings as Meaning[]
}

export async function createMeaning(data: MeaningPayload): Promise<Meaning> {
  const res = await client.post('/api/v1/admin/meanings', data)
  return res.data.data.meaning as Meaning
}

export async function updateMeaning(id: string, data: Partial<MeaningPayload>): Promise<Meaning> {
  const res = await client.patch(`/api/v1/admin/meanings/${id}`, data)
  return res.data.data.meaning as Meaning
}

export async function deleteMeaning(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/meanings/${id}`)
}
