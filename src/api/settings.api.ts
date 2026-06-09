import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminSettings {
  freeGiftEnabled: boolean
  whatsappNumber: string
  whatsappDefaultMessage: string
}

/** @deprecated Use AdminSettings */
export type StoreSettings = AdminSettings

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAdminSettings(): Promise<AdminSettings> {
  const res = await client.get('/api/v1/admin/settings')
  return res.data.data.settings as AdminSettings
}

export async function updateAdminSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
  const res = await client.patch('/api/v1/admin/settings', data)
  return res.data.data.settings as AdminSettings
}
