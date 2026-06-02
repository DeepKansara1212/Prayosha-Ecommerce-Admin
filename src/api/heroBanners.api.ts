import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeroBanner {
  _id: string
  imageUrl: string
  imagePublicId: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAdminBanners(): Promise<HeroBanner[]> {
  const res = await client.get('/api/v1/admin/hero-banners')
  return res.data.data.banners as HeroBanner[]
}

export async function createBanner(form: FormData): Promise<HeroBanner> {
  const res = await client.post('/api/v1/admin/hero-banners', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data.banner as HeroBanner
}

export async function updateBanner(id: string, form: FormData): Promise<HeroBanner> {
  const res = await client.patch(`/api/v1/admin/hero-banners/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data.banner as HeroBanner
}

export async function toggleBanner(id: string): Promise<HeroBanner> {
  const res = await client.patch(`/api/v1/admin/hero-banners/${id}/toggle`)
  return res.data.data.banner as HeroBanner
}

export async function reorderBanners(
  items: Array<{ id: string; order: number }>
): Promise<HeroBanner[]> {
  const res = await client.patch('/api/v1/admin/hero-banners/reorder', { items })
  return res.data.data.banners as HeroBanner[]
}

export async function deleteBanner(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/hero-banners/${id}`)
}
