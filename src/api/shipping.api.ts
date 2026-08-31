import client from './client'
import type { Order } from './orders.api'

export interface TrackingCheckpoint {
  time: string
  message: string
  location: string
}

export interface TrackingInfo {
  status: string
  trackingNumber?: string
  carrier?: string
  trackingUrl?: string
  estimatedDelivery?: string
  checkpoints: TrackingCheckpoint[]
}

export async function createShipment(orderId: string, provider: string): Promise<Order> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/shipments`, { provider })
  return res.data.data as Order
}

export async function trackShipment(orderId: string): Promise<TrackingInfo> {
  const res = await client.get(`/api/v1/admin/orders/${orderId}/shipments/track`)
  return res.data.data as TrackingInfo
}

export async function cancelShipment(orderId: string): Promise<Order> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/shipments/cancel`)
  return res.data.data as Order
}

export async function downloadLabel(orderId: string): Promise<{ labelUrl: string }> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/shipments/label`)
  return res.data.data as { labelUrl: string }
}

export async function generateInvoice(orderId: string): Promise<{ invoiceUrl: string }> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/shipments/invoice`)
  return res.data.data as { invoiceUrl: string }
}
