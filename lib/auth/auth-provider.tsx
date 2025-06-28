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
      const refreshToken = localStorage.getItem("refreshToken")
      const storedUser = localStorage.getItem("user")

      if (refreshToken && storedUser) {
        try {
          // Verificar o token usando o endpoint de refresh
          const response = await api.post("/v1/auth/refresh", { refreshToken })
          const { token } = response.data // Only expect token from refresh

          // Atualizar o token
          localStorage.setItem("token", token)
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          // Atualizar o usuário com os dados do localStorage
          const user = JSON.parse(storedUser)
          setUser(user)
        } catch (error) {
          // Se o token for inválido ou expirado, limpar os dados de autenticação
          localStorage.removeItem("token")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
          setUser(null) // Clear user state
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
      const isPublicRoute = pathname?.startsWith("/terms") || pathname?.startsWith("/privacy")

      if (!user && !isAuthRoute && !isPublicRoute && pathname !== "/") {
        router.push("/login")
      } else if (user && isAuthRoute) {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string) => {
    try {
      console.log("Tentando fazer login com:", { email, password }) // Debug
      const response = await api.post("/v1/auth/login", { email, password })
      console.log("Resposta do login:", response.data) // Debug
      const { token, refreshToken, user } = response.data

      // Store token in localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))

      // Set token in axios headers for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Update user state
      setUser(user)

      return user
    } catch (error) {
      console.log("Erro no login (auth-provider):", error) // Debug
      // Re-throw the error so it can be caught by the form
      throw error
    }
  }

  const logout = async () => {
    try {
      // Chamar o endpoint de logout
      await api.post("/v1/auth/logout")
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Remove token from localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")

      // Remove token from axios headers
      delete api.defaults.headers.common["Authorization"]

      // Clear user state
      setUser(null)

      // Redirect to login
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}
