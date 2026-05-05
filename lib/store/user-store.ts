import { create } from "zustand"
import { fetchUsers } from "@/lib/api/users-api"
import type { User } from "@/lib/types"

type UsersState = {
  users: User[]
  isLoading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const users = await fetchUsers()
      set({ users, isLoading: false })
    } catch {
      set({ error: "Failed to fetch users", isLoading: false })
    }
  },
}))
