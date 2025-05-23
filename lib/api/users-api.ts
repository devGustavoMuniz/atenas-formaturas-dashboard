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
  userContract: string // Adicionado o campo userContract
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
export async function fetchUsers(params: PaginationParams = {}): Promise<User[]> {
  const { page = 1, limit = 10, search } = params

  // Construir os parâmetros de consulta
  const queryParams = new URLSearchParams()
  queryParams.append("page", page.toString())
  queryParams.append("limit", limit.toString())

  if (search) {
    queryParams.append("search", search)
  }

  const response = await api.get(`/v2/users?${queryParams.toString()}`)
  return response.data.data
}

export async function fetchUserById(id: string): Promise<User> {
  const response = await api.get(`/v2/users/${id}`)
  return response.data
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const response = await api.post("/v2/users", userData)
  return response.data
}

export async function updateUser(id: string, userData: Partial<Omit<User, "id">>): Promise<User> {
  // Remover o campo 'id' do userData se ele existir
  const { id: _, ...dataWithoutId } = userData as any

  const response = await api.put(`/v2/users/${id}`, dataWithoutId)
  return response.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/v2/users/${id}`)
}

export async function fetchRecentUsers(): Promise<User[]> {
  // Dados mockados para substituir a chamada de API
  return [
    {
      id: "1",
      name: "Maria Silva",
      email: "maria.silva@exemplo.com",
      avatar: "/placeholder.svg",
      createdAt: "2023-05-15T10:30:00Z",
    },
    {
      id: "2",
      name: "João Santos",
      email: "joao.santos@exemplo.com",
      avatar: "/placeholder.svg",
      createdAt: "2023-05-14T14:45:00Z",
    },
    {
      id: "3",
      name: "Ana Oliveira",
      email: "ana.oliveira@exemplo.com",
      avatar: "/placeholder.svg",
      createdAt: "2023-05-13T09:15:00Z",
    },
    {
      id: "4",
      name: "Pedro Costa",
      email: "pedro.costa@exemplo.com",
      avatar: "/placeholder.svg",
      createdAt: "2023-05-12T16:20:00Z",
    },
    {
      id: "5",
      name: "Carla Souza",
      email: "carla.souza@exemplo.com",
      avatar: "/placeholder.svg",
      createdAt: "2023-05-11T11:10:00Z",
    },
  ] as any[]
}

export async function fetchUserStats(): Promise<UserStats> {
  // Dados mockados para substituir a chamada de API
  return {
    total: 256,
    new: 24,
    active: 210,
    inactive: 46,
    growthRate: 12,
    newGrowthRate: 18,
    activeGrowthRate: 8,
    inactiveGrowthRate: -5,
  }
}

// Função para obter URL presigned para upload de imagem
export async function getPresignedUrl({
  contentType,
}: {
  contentType: string
}): Promise<{ uploadUrl: string; filename: string }> {
  // Atualizar o endpoint para /v2/storage/presigned-url
  const response = await api.post("/v2/storage/presigned-url", { contentType })
  return response.data
}
