"use client"

import type React from "react"
import { createContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { api } from "@/lib/api/axios-config"
import { fetchUserById } from "@/lib/api/users-api"
import { useAuthStore } from "@/lib/store/auth-store" // Importar o store
import type { User } from "@/lib/types"

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {
    throw new Error("Login function not implemented")
  },
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null) // Manter o estado local original
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Obter as ações do Zustand para sincronização
  const { setUser: setZustandUser, setToken: setZustandToken, logout: logoutFromZustand } = useAuthStore()

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
          const fullUser = await fetchUserById(user.id)
          
          // 1. Atualiza o estado local (lógica original)
          setUser(fullUser)
          // 2. SINCRONIZA: Atualiza o Zustand Store
          setZustandUser(fullUser)
          setZustandToken(token)

        } catch (error) {
          localStorage.removeItem("token")
          localStorage.removeItem("refreshToken")
          // 1. Limpa o estado local (lógica original)
          setUser(null)
          // 2. SINCRONIZA: Limpa o Zustand Store
          logoutFromZustand()
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
      const { token, refreshToken, user: userData } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify({ id: userData.id, email: userData.email, role: userData.role }))

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      const fullUser = await fetchUserById(userData.id)
      
      // 1. Atualiza o estado local (lógica original)
      setUser(fullUser)
      // 2. SINCRONIZA: Atualiza o Zustand Store
      setZustandUser(fullUser)
      setZustandToken(token)

      return fullUser
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

      // 1. Limpa o estado local (lógica original)
      setUser(null)
      // 2. SINCRONIZA: Limpa o Zustand Store
      logoutFromZustand()

      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

