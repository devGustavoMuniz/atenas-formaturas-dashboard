import axios from "axios"

// Create axios instance with base URL
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
})

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
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

// Add response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Check if the error is due to an expired token and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true // Mark that we've tried to refresh the token

      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          // If no refresh token, redirect to login
          window.location.href = "/login"
          return Promise.reject(error)
        }

        // Request a new token using the refresh token
        const response = await api.post("/v1/auth/refresh", { refreshToken })
        const { token: newToken } = response.data

        // Store the new token
        localStorage.setItem("token", newToken)

        // Update the Authorization header for the original request
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`

        // Update the default Authorization header for subsequent requests
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`

        // Retry the original request with the new token
        return api(originalRequest)
      } catch (refreshError) {
        // If refreshing the token fails, clear all auth data and redirect to login
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    // For other errors, just reject the promise
    return Promise.reject(error)
  },
)
