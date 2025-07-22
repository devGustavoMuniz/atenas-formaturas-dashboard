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
  profileImage?: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<User>
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

  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = localStorage.getItem("refreshToken")
      const storedUser = localStorage.getItem("user")

      if (refreshToken && storedUser) {
        try {
          const response = await api.post("/v1/auth/refresh", { refreshToken })
          const { token } = response.data

          localStorage.setItem("token", token)
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          const user = JSON.parse(storedUser)
          setUser(user)
        } catch (error) {
          localStorage.removeItem("token")
          localStorage.removeItem("refreshToken")
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname?.startsWith("/login")
      const isPublicRoute = pathname?.startsWith("/terms") || pathname?.startsWith("/privacy")

      if (!user && !isAuthRoute && !isPublicRoute && pathname !== "/") {
        router.push("/login")
      } else if (user && isAuthRoute) {
        if (user.role === "client") {
          router.push("/client/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/v1/auth/login", { email, password })
      const { token, refreshToken, user } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)

      return user
    } catch (error) {
      console.error("Erro no login (auth-provider):", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.post("/v1/auth/logout")
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")

      delete api.defaults.headers.common["Authorization"]

      setUser(null)

      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}
