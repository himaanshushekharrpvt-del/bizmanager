import axios from 'axios'

export const TOKEN_KEY = 'bizmanager_token'
export const USER_KEY = 'bizmanager_user'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

/** Pulls the readable message out of our backend's ApiError shape, falling back sensibly. */
export function apiErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'
}

export default client
