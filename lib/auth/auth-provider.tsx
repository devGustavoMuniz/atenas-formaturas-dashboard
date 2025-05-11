"use client"

import type React from "react"

import { createContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "@/lib/api/axios-config"

type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")

      if (token) {
        try {
          // In a real app, you would validate the token with your backend
          // For demo purposes, we'll just simulate a successful auth check
          setUser({
            id: "1",
            name: "Admin User",
            email: "admin@example.com",
            role: "admin",
          })
        } catch (error) {
          localStorage.removeItem("token")
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Redirect based on auth status
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname?.startsWith("/login")

      if (!user && !isAuthRoute && pathname !== "/") {
        router.push("/login")
      } else if (user && isAuthRoute) {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string) => {
    try {
      // In a real app, you would make an API call to authenticate
      // For demo purposes, we'll simulate a successful login

      // Simulate API call
      // const response = await api.post("/auth/login", { email, password })
      // const { token, user } = response.data

      // Simulate successful response
      const token = "fake-jwt-token"
      const userData = {
        id: "1",
        name: "Admin User",
        email,
        role: "admin",
      }

      // Store token in localStorage
      localStorage.setItem("token", token)

      // Set token in axios headers for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Update user state
      setUser(userData)

      return userData
    } catch (error) {
      throw new Error("Authentication failed")
    }
  }

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token")

    // Remove token from axios headers
    delete api.defaults.headers.common["Authorization"]

    // Clear user state
    setUser(null)

    // Redirect to login
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}
