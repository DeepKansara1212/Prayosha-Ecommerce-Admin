import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Admin {
  _id: string
  name: string
  email: string
  role: string
  avatar?: string
}

interface AdminAuthState {
  admin: Admin | null
  accessToken: string | null
  login: (admin: Admin, accessToken: string) => void
  logout: () => void
  setAdmin: (admin: Admin) => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      login: (admin, accessToken) => set({ admin, accessToken }),
      logout: () => set({ admin: null, accessToken: null }),
      setAdmin: (admin) => set({ admin }),
    }),
    { name: 'admin-auth' },
  ),
)
