import axios from 'axios'

const ACCESS_TOKEN_KEY = 'prepflow.accessToken'
const REFRESH_TOKEN_KEY = 'prepflow.refreshToken'

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setAuthTokens = (tokens?: { accessToken?: string; refreshToken?: string }) => {
  if (tokens?.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  if (tokens?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
})

let isRefreshing = false
let refreshQueue: Array<() => void> = []

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    const url: string = original.url ?? ''
    const isAuthEndpoint = url.includes('/api/auth/')

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
      const refreshRes = await axios.post(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/refresh`,
        { refreshToken: getRefreshToken() },
        { withCredentials: true }
      )
      setAuthTokens(refreshRes.data)
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
