import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Customer {
  _id: string
  name: string
  email: string
  phone?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface CustomersParams {
  search?: string
  page?: number
  limit?: number
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getCustomers(
  params?: CustomersParams,
): Promise<{ customers: Customer[]; pagination: Pagination }> {
  const res = await client.get('/api/v1/admin/customers', { params })
  return res.data.data as { customers: Customer[]; pagination: Pagination }
}
