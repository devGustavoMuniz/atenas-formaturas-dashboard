import { api } from "./axios-config"
import type { User } from "./users-api"

// Types
export type ProfileUpdateInput = {
    name?: string
    email?: string
    phone?: string
    password?: string
    profileImage?: string
    address?: {
        zipCode: string
        street: string
        number: string
        complement?: string
        neighborhood: string
        city: string
        state: string
    } | null
}

// API functions
export async function updateProfile(profileData: ProfileUpdateInput): Promise<User> {
    const response = await api.patch("/v1/profile", profileData)
    return response.data
}
