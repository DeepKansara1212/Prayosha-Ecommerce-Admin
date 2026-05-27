import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscountType = 'flat' | 'percent'

export interface Coupon {
  _id: string
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderValue: number
  maxUsage: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCouponPayload {
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderValue: number
  maxUsage: number
  validFrom: string
  validUntil: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getCoupons(): Promise<Coupon[]> {
  const res = await client.get('/api/v1/admin/coupons')
  return res.data.data.coupons as Coupon[]
}

export async function createCoupon(data: CreateCouponPayload): Promise<Coupon> {
  const payload = {
    ...data,
    validFrom:  new Date(data.validFrom  + 'T00:00:00.000Z').toISOString(),
    validUntil: new Date(data.validUntil + 'T23:59:59.999Z').toISOString(),
  }
  const res = await client.post('/api/v1/admin/coupons', payload)
  return res.data.data.coupon as Coupon
}

export async function updateCoupon(
  id: string,
  data: { isActive: boolean },
): Promise<Coupon> {
  const res = await client.patch(`/api/v1/admin/coupons/${id}`, data)
  return res.data.data.coupon as Coupon
}
