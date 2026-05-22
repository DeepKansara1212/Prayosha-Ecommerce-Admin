import axios from 'axios'
import { useAdminAuthStore } from '../store/adminAuthStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as { response?: { status: number } }
    if (axiosError.response?.status === 401) {
      useAdminAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

export default client
