import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'cod' | 'razorpay'

export interface OrderUser {
  _id: string
  name: string
  email: string
  phone?: string
}

export interface OrderItem {
  product: string
  name: string
  image: string
  sku: string
  price: number
  quantity: number
}

export interface ShippingAddress {
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export interface StatusHistoryEntry {
  status: string
  note: string
  timestamp: string
}

export interface TrackingCheckpoint {
  time: string
  message: string
  location: string
}

export interface Order {
  _id: string
  orderNumber: string
  user: OrderUser
  items: OrderItem[]
  shippingAddress: ShippingAddress
  subtotal: number
  discount: number
  couponCode?: string
  shippingCharge: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status: OrderStatus
  trackingNumber?: string
  shiprocketOrderId?: string
  shiprocketShipmentId?: string
  awbCode?: string
  courierName?: string
  labelUrl?: string
  shiprocketStatus?: string
  aftershipTrackingId?: string
  aftershipStatus?: string
  trackingUrl?: string
  trackingCheckpoints?: TrackingCheckpoint[]
  statusHistory: StatusHistoryEntry[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface OrdersParams {
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

export interface UpdateStatusPayload {
  status: OrderStatus
  note?: string
  trackingNumber?: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAllOrders(
  params?: OrdersParams,
): Promise<{ orders: Order[]; pagination: Pagination }> {
  const res = await client.get('/api/v1/admin/orders', { params })
  return res.data.data as { orders: Order[]; pagination: Pagination }
}

export async function getOrderDetail(id: string): Promise<Order> {
  const res = await client.get(`/api/v1/admin/orders/${id}`)
  return res.data.data.order as Order
}

export async function updateOrderStatus(
  id: string,
  data: UpdateStatusPayload,
): Promise<Order> {
  const res = await client.patch(`/api/v1/admin/orders/${id}/status`, data)
  return res.data.data as Order
}
