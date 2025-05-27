import { api } from "./axios-config"
import type { PaginationParams } from "./users-api"

// Types
export type Institution = {
  id: string
  contractNumber: string
  name: string
  observations: string
  events: string[]
  userCount: number
  createdAt: string
}

// API functions
export async function fetchInstitutions(params: PaginationParams = {}): Promise<Institution[]> {
  const { page = 1, limit = 10, search } = params

  // Construir os parâmetros de consulta
  const queryParams = new URLSearchParams()
  queryParams.append("page", page.toString())
  queryParams.append("limit", limit.toString())

  if (search && search.trim() !== "") {
    queryParams.append("search", search.trim())
  }

  const response = await api.get(`/v2/institutions?${queryParams.toString()}`)
  return response.data.data || []
}

export async function fetchInstitutionById(id: string): Promise<Institution> {
  const response = await api.get(`/v2/institutions/${id}`)
  return response.data
}

export async function createInstitution(
  institutionData: Omit<Institution, "id" | "createdAt" | "userCount">,
): Promise<Institution> {
  const response = await api.post("/v2/institutions", institutionData)
  return response.data
}

export async function updateInstitution(
  id: string,
  institutionData: Partial<Omit<Institution, "id">>,
): Promise<Institution> {
  // Remover o campo 'id' do institutionData se ele existir
  const { id: _, ...dataWithoutId } = institutionData as any

  const response = await api.put(`/v2/institutions/${id}`, dataWithoutId)
  return response.data
}

export async function deleteInstitution(id: string): Promise<void> {
  await api.delete(`/v2/institutions/${id}`)
}
