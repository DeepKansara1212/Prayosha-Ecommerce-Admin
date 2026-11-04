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

export interface AfterShipTrackingInput {
  carrierName: string
  trackingNumber: string
  courierSlug?: string
}

export type ShipmentCreationResult = Order & {
  trackingEmailSent?: boolean
  trackingEmailError?: string
}

export interface TrackingEmailResult {
  trackingEmailStatusSaved: boolean
}

export async function createShipment(
  orderId: string,
  provider: string,
  tracking?: AfterShipTrackingInput,
): Promise<ShipmentCreationResult> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/shipments`, {
    provider,
    ...tracking,
  })
  return res.data.data as ShipmentCreationResult
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

export async function resendTrackingEmail(orderId: string): Promise<TrackingEmailResult> {
  const res = await client.post(`/api/v1/admin/orders/${orderId}/shipments/tracking-email`)
  return res.data.data as TrackingEmailResult
}
