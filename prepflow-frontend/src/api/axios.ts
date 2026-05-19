import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
})

let isRefreshing = false
let refreshQueue: Array<() => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    const url: string = original.url ?? ''
    const isAuthEndpoint = url.includes('/api/auth/refresh') || url.includes('/api/auth/logout')

    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(() => resolve(api(original)))
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/refresh`,
        {},
        { withCredentials: true }
      )
      refreshQueue.forEach((cb) => cb())
      refreshQueue = []
      return api(original)
    } catch {
      refreshQueue = []
      window.dispatchEvent(new Event('auth:logout'))
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
