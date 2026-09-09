import axios from 'axios'
import { useAdminAuthStore } from '../store/adminAuthStore'
import type { InternalAxiosRequestConfig, AxiosError } from 'axios'


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
const pendingQueue: Array<(token: string | null) => void> = []

function flushQueue(token: string | null) {
  pendingQueue.splice(0).forEach(fn => fn(token))
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // const config = error.config as any
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const is401 = error.response?.status === 401
    const isRefreshEndpoint = (config?.url ?? '').includes('refresh-token')

    if (!is401 || config._retry || isRefreshEndpoint) {
      return Promise.reject(error)
    }

    config._retry = true

    if (refreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error)
          config.headers.Authorization = `Bearer ${token}`
          resolve(client(config))
        })
      })
    }

    refreshing = true

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/v1/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      const newToken: string = data.data.accessToken
      useAdminAuthStore.setState({ accessToken: newToken })
      config.headers.Authorization = `Bearer ${newToken}`
      flushQueue(newToken)
      return client(config)
    } catch (refreshError) {
      flushQueue(null)
      useAdminAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      refreshing = false
    }
  },
)

export default client