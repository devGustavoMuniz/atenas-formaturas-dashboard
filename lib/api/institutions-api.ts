import { api } from "./axios-config"

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
// Modificar a função fetchInstitutions para incluir parâmetros de paginação
export async function fetchInstitutions(page = 1, limit = 10): Promise<Institution[]> {
  const response = await api.get(`/v2/institution?page=${page}&limit=${limit}`)
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
