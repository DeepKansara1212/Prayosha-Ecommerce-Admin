import client from './client'
import type { Order } from './orders.api'

export interface TrackingCheckpoint {
  time: string
  message: string
  location: string
}

export interface TrackingInfo {
  awbCode?: string
  courierName?: string
  shiprocketStatus?: string
  aftershipStatus?: string
  trackingUrl?: string
  labelUrl?: string
  trackingCheckpoints?: TrackingCheckpoint[]
  status?: string
}

export async function pushToShipRocket(orderId: string): Promise<Order> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/ship`)
  return res.data.data as Order
}

export async function generateLabel(orderId: string): Promise<{ labelUrl: string }> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/generate-label`)
  return res.data.data as { labelUrl: string }
}

export async function trackOrder(orderId: string): Promise<TrackingInfo> {
  const res = await client.get(`/api/v1/admin/orders/${orderId}/track`)
  return res.data.data as TrackingInfo
}

export async function syncTracking(orderId: string): Promise<Order> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/sync-tracking`)
  return res.data.data as Order
}

export async function cancelShipment(orderId: string): Promise<Order> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/cancel-shipment`)
  return res.data.data as Order
}
