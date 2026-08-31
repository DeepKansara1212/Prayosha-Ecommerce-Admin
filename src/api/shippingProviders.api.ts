import client from './client'

export interface ShippingProvider {
  _id: string
  name: string
  slug: string
  description?: string
  logo?: string
  isActive: boolean
  isDefault: boolean
  hasCredentials: boolean
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export async function getShippingProviders(): Promise<ShippingProvider[]> {
  const res = await client.get('/api/v1/admin/shipping-providers')
  return res.data.data.providers as ShippingProvider[]
}

export async function updateShippingProvider(
  id: string,
  data: { isActive?: boolean; credentials?: Record<string, string | number | boolean> },
): Promise<ShippingProvider> {
  const res = await client.patch(`/api/v1/admin/shipping-providers/${id}`, data)
  return res.data.data.provider as ShippingProvider
}

export async function setDefaultShippingProvider(id: string): Promise<ShippingProvider> {
  const res = await client.post(`/api/v1/admin/shipping-providers/${id}/set-default`)
  return res.data.data.provider as ShippingProvider
}
