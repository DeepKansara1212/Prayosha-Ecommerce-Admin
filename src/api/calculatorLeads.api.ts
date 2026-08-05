import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BirthLocation {
  displayName: string
  name: string
  state?: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  timezone: string
}

export interface CalculatorLead {
  _id: string
  name: string
  mobile: string
  dob: string
  birthLocation: BirthLocation
  calculatorType: 'bracelet' | 'rudraksha'
  purpose?: { _id: string; name: string }
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

export interface CalculatorLeadsParams {
  search?: string
  page?: number
  limit?: number
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getCalculatorLeads(
  params?: CalculatorLeadsParams,
): Promise<{ leads: CalculatorLead[]; pagination: Pagination }> {
  const res = await client.get('/api/v1/admin/calculator-leads', { params })
  return res.data.data as { leads: CalculatorLead[]; pagination: Pagination }
}
