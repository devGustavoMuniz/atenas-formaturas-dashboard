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
// Modificar a função fetchInstitutions para usar parâmetros de paginação corretamente
export async function fetchInstitutions(params: PaginationParams = {}): Promise<Institution[]> {
  const { page = 1, limit = 10, search } = params

  // Construir os parâmetros de consulta
  const queryParams = new URLSearchParams()
  queryParams.append("page", page.toString())
  queryParams.append("limit", limit.toString())

  if (search) {
    queryParams.append("search", search)
  }

  const response = await api.get(`/v2/institution?${queryParams.toString()}`)
  return response.data.data
}

export async function fetchInstitutionById(id: string): Promise<Institution> {
  const response = await api.get(`/v2/institution/${id}`)
  return response.data
}

export async function createInstitution(
  institutionData: Omit<Institution, "id" | "createdAt" | "userCount">,
): Promise<Institution> {
  const response = await api.post("/v2/institution", institutionData)
  return response.data
}

export async function updateInstitution(id: string, institutionData: Partial<Institution>): Promise<Institution> {
  const response = await api.put(`/v2/institution/${id}`, institutionData)
  return response.data
}

export async function deleteInstitution(id: string): Promise<void> {
  await api.delete(`/v2/institution/${id}`)
}
