import { api } from "./axios-config"

// Types
export type User = {
  id: string
  name: string
  identifier: string
  email: string
  phone: string
  observations?: string
  role: "admin" | "client"
  institutionId: string
  fatherName?: string
  fatherPhone?: string
  motherName?: string
  motherPhone?: string
  driveLink?: string
  creditValue?: number
  profileImage?: string
  status: "active" | "inactive"
  createdAt: string
}

export type UserStats = {
  total: number
  new: number
  active: number
  inactive: number
  growthRate: number
  newGrowthRate: number
  activeGrowthRate: number
  inactiveGrowthRate: number
}

// API functions
export async function fetchUsers(): Promise<User[]> {
  const response = await api.get("/api/users")
  return response.data.data
}

export async function fetchUserById(id: string): Promise<User> {
  const response = await api.get(`/api/users/${id}`)
  return response.data
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const response = await api.post("/api/users", userData)
  return response.data
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const response = await api.put(`/api/users/${id}`, userData)
  return response.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/users/${id}`)
}

export async function fetchRecentUsers(): Promise<User[]> {
  const response = await api.get("/api/users/recent")
  return response.data
}

// Adicione a função fetchUserStats após a função fetchRecentUsers

export async function fetchUserStats(): Promise<UserStats> {
  const response = await api.get("/api/users/stats")
  return response.data
}

// Função para obter URL presigned para upload de imagem
export async function getPresignedUrl({
  contentType,
}: {
  contentType: string
}): Promise<{ uploadUrl: string; filename: string }> {
  const response = await api.post("/api/presigned-url", { contentType })
  return response.data
}
