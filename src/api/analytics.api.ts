import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopProduct {
  _id: string
  name: string
  image: string
  revenue: number
  unitsSold: number
}

export interface OverviewData {
  totalRevenue: number
  totalOrders: number
  ordersToday: number
  revenueToday: number
  newCustomersThisMonth: number
  totalProducts: number
  lowStockCount: number
  topProducts: TopProduct[]
}

export interface SalesPoint {
  date: string
  revenue: number
  orderCount: number
}

export interface SalesData {
  period: string
  data: SalesPoint[]
}

export interface OrderStatusCount {
  status: string
  count: number
}

export interface LowStockProduct {
  _id: string
  name: string
  sku: string
  stock: number
  lowStockThreshold: number
  category?: { _id: string; name: string }
}

export interface LowStockData {
  count: number
  products: LowStockProduct[]
}

export interface RecentOrderUser {
  _id: string
  name: string
  email: string
  phone: string
}

export interface RecentOrder {
  _id: string
  orderNumber: string
  user: RecentOrderUser | null
  shippingAddress: {
    fullName: string
    phone: string
    city: string
    state: string
  }
  total: number
  status: string
  paymentStatus: string
  createdAt: string
}

export interface RecentOrdersData {
  orders: RecentOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getOverview(): Promise<OverviewData> {
  const res = await client.get('/api/v1/admin/analytics/overview')
  return res.data.data as OverviewData
}

export async function getSalesOverTime(period: '7d' | '30d' | '90d'): Promise<SalesData> {
  const res = await client.get('/api/v1/admin/analytics/sales', { params: { period } })
  return res.data.data as SalesData
}

export async function getOrdersByStatus(): Promise<OrderStatusCount[]> {
  const res = await client.get('/api/v1/admin/analytics/orders-by-status')
  return res.data.data as OrderStatusCount[]
}

export async function getLowStockProducts(): Promise<LowStockData> {
  const res = await client.get('/api/v1/admin/analytics/low-stock')
  return res.data.data as LowStockData
}

export async function getRecentOrders(): Promise<RecentOrdersData> {
  const res = await client.get('/api/v1/admin/orders', { params: { limit: 5, page: 1 } })
  return res.data.data as RecentOrdersData
}
