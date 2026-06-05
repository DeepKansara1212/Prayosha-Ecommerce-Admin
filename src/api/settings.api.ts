import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoreSettings {
  freeGiftEnabled: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAdminSettings(): Promise<StoreSettings> {
  const res = await client.get('/api/v1/admin/settings')
  return res.data.data.settings as StoreSettings
}

export async function updateAdminSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
  const res = await client.patch('/api/v1/admin/settings', data)
  return res.data.data.settings as StoreSettings
}
