import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Se o erro vem da própria chamada de login ou refresh, não faz nada, apenas rejeita
    if (
      originalRequest.url?.includes("/v1/auth/login") ||
      originalRequest.url?.includes("/v1/auth/refresh")
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          return Promise.reject(error)
        }

        const response = await api.post("/v1/auth/refresh", { refreshToken })
        const { token: newToken } = response.data

        localStorage.setItem("token", newToken)

        originalRequest.headers["Authorization"] = `Bearer ${newToken}`

        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
