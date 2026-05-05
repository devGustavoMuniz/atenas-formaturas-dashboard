"use client"

import type React from "react"
import { createContext, useEffect, useMemo, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { api } from "@/lib/api/axios-config"
import { fetchUserById } from "@/lib/api/users-api"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"
import type { User } from "@/lib/types"
import { FirstAccessModal } from "@/components/auth/first-access-modal"

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  updateUser: (user: User) => void
}


export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {
    throw new Error("Login function not implemented")
  },
  logout: () => { },
  updateUser: () => { },
  isLoading: true,
  isAuthenticated: false,
})

const publicRoutes = ["/terms", "/privacy"]
const authRoutes = ["/login", "/forgot-password"]
const clientOnlyPrefixes = ["/client", "/checkout", "/payment"]
const adminOnlyPrefixes = ["/dashboard", "/users", "/orders", "/products", "/institutions"]

function isRoute(pathname: string | null | undefined, routes: string[]) {
  return routes.some((route) => pathname === route || pathname?.startsWith(`${route}/`))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const { setUser: setZustandUser, setToken: setZustandToken, logout: logoutFromZustand } = useAuthStore()
  const { fetchCart } = useCartStore()

  const isPublicRoute = useMemo(() => isRoute(pathname, publicRoutes), [pathname])
  const isAuthRoute = useMemo(() => isRoute(pathname, authRoutes), [pathname])
  const syncAuthenticatedUser = useCallback((authenticatedUser: User, token?: string) => {
    setUser(authenticatedUser)
    setZustandUser(authenticatedUser)

    if (token) {
      setZustandToken(token)
    }

    if (authenticatedUser.role === "client") {
      fetchCart()
    }
  }, [fetchCart, setZustandToken, setZustandUser])

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

          const storedUserData = JSON.parse(storedUser)
          const fullUser = await fetchUserById(storedUserData.id)

          syncAuthenticatedUser(fullUser, token)

        } catch {
          localStorage.removeItem("token")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("user")
          setUser(null)
          logoutFromZustand()
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [logoutFromZustand, syncAuthenticatedUser])

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isAuthRoute && !isPublicRoute && pathname !== "/") {
        router.push("/login")
      } else if (user && isAuthRoute) {
        if (user.role === "client") {
          router.replace("/client/products")
        } else {
          router.replace("/dashboard")
        }
      } else if (user?.role === "client" && isRoute(pathname, adminOnlyPrefixes)) {
        router.replace("/client/products")
      } else if (user?.role === "admin" && isRoute(pathname, clientOnlyPrefixes)) {
        router.replace("/dashboard")
      }
    }
  }, [user, isLoading, pathname, router, isAuthRoute, isPublicRoute])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/v1/auth/login", { email, password })
      const { token, refreshToken, user: userData } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify({ id: userData.id, email: userData.email, role: userData.role }))

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      const fullUser = await fetchUserById(userData.id)

      syncAuthenticatedUser(fullUser, token)

      // Verifica se é primeiro acesso (sem lastLoginAt)
      if (!userData.lastLoginAt) {
        setShowFirstAccessModal(true)
      }

      return fullUser
    } catch (error: any) {
      console.error("Erro no login (auth-provider):", error)
      // Garante que o erro seja sempre lançado e nunca cause redirect/reload
      if (error?.response?.status === 401) {
        throw new Error("Email ou senha incorretos")
      }
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
      logoutFromZustand()

      router.push("/login")
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    setZustandUser(updatedUser)
  }

  const shouldHoldRoute = isLoading && !isPublicRoute

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading, isAuthenticated: !!user }}>
      {shouldHoldRoute ? (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-yellow-500" />
        </div>
      ) : (
        children
      )}

      <FirstAccessModal
        open={showFirstAccessModal}
        onClose={() => setShowFirstAccessModal(false)}
        userName={user?.name}
      />
    </AuthContext.Provider>
  )
}
