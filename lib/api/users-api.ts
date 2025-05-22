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

// Tipo para parâmetros de paginação
export type PaginationParams = {
  page?: number
  limit?: number
  search?: string
}

// API functions
// Modificar a função fetchUsers para usar parâmetros de paginação corretamente
export async function fetchUsers(params: PaginationParams = {}): Promise<User[]> {
  const { page = 1, limit = 10, search } = params

  // Construir os parâmetros de consulta
  const queryParams = new URLSearchParams()
  queryParams.append("page", page.toString())
  queryParams.append("limit", limit.toString())

  if (search) {
    queryParams.append("search", search)
  }

  const response = await api.get(`/v2/user?${queryParams.toString()}`)
  return response.data.data
}

export async function fetchUserById(id: string): Promise<User> {
  const response = await api.get(`/v2/user/${id}`)
  return response.data
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const response = await api.post("/v2/user", userData)
  return response.data
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const response = await api.put(`/v2/user/${id}`, userData)
  return response.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/v2/user/${id}`)
}

export async function fetchRecentUsers(): Promise<User[]> {
  const response = await api.get("/v2/user/recent")
  return response.data
}

export async function fetchUserStats(): Promise<UserStats> {
  const response = await api.get("/v2/user/stats")
  return response.data
}

// Função para obter URL presigned para upload de imagem
export async function getPresignedUrl({
  contentType,
}: {
  contentType: string
}): Promise<{ uploadUrl: string; filename: string }> {
  const response = await api.post("/v2/presigned-url", { contentType })
  return response.data
}
