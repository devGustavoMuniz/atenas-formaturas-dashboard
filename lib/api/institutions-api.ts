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
export async function fetchInstitutions(): Promise<Institution[]> {
  const response = await api.get("/api/institutions")
  return response.data.data
}

export async function fetchInstitutionById(id: string): Promise<Institution> {
  const response = await api.get(`/api/institutions/${id}`)
  return response.data
}

export async function createInstitution(
  institutionData: Omit<Institution, "id" | "createdAt" | "userCount">,
): Promise<Institution> {
  const response = await api.post("/api/institutions", institutionData)
  return response.data
}

export async function updateInstitution(id: string, institutionData: Partial<Institution>): Promise<Institution> {
  const response = await api.put(`/api/institutions/${id}`, institutionData)
  return response.data
}

export async function deleteInstitution(id: string): Promise<void> {
  await api.delete(`/api/institutions/${id}`)
}
