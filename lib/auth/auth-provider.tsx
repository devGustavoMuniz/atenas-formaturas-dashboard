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
          // Set token in axios headers for future requests
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          // Você pode adicionar uma chamada para verificar o token, se o backend tiver um endpoint para isso
          // const response = await api.get("/api/auth/me")
          // setUser(response.data)

          // Como alternativa, podemos extrair as informações do usuário do token JWT
          // Para simplificar, estamos usando o usuário armazenado no localStorage
          const userData = JSON.parse(localStorage.getItem("user") || "null")
          if (userData) {
            setUser(userData)
          } else {
            localStorage.removeItem("token")
          }
        } catch (error) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
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
      const response = await api.post("/api/auth/login", { email, password })
      const { token, user } = response.data

      // Store token in localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))

      // Set token in axios headers for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Update user state
      setUser(user)

      return user
    } catch (error) {
      throw new Error("Authentication failed")
    }
  }

  const logout = async () => {
    try {
      // Chamar o endpoint de logout, se disponível
      await api.post("/api/auth/logout")
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Remove token from localStorage
      localStorage.removeItem("token")
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
