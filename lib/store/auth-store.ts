import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/lib/types"

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  setHasHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

