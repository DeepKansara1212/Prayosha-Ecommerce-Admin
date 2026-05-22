import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewProduct {
  _id: string
  name: string
  images: string[]
}

export interface ReviewUser {
  _id: string
  name: string
}

export interface Review {
  _id: string
  product: ReviewProduct
  user: ReviewUser
  rating: number
  title: string
  body: string
  isVerifiedPurchase: boolean
  isApproved: boolean
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

export interface ReviewsParams {
  status?: 'pending' | 'approved'
  page?: number
  limit?: number
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAllReviews(
  params?: ReviewsParams,
): Promise<{ reviews: Review[]; pagination: Pagination }> {
  const res = await client.get('/api/v1/admin/reviews', { params })
  return res.data.data as { reviews: Review[]; pagination: Pagination }
}

export async function approveReview(id: string): Promise<Review> {
  const res = await client.patch(`/api/v1/admin/reviews/${id}/approve`)
  return res.data.data as Review
}

export async function deleteReview(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/reviews/${id}`)
}
