import { api } from "./axios-config"
import type { PaginationParams } from "./users-api"

// Types
export type InstitutionEvent = {
  id: string
  name: string
}

export type InstitutionEventInput = {
  id?: string
  name: string
}

export type Institution = {
  id: string
  contractNumber: string
  name: string
  observations?: string
  events: InstitutionEvent[]
  userCount: number
  createdAt: string
}

export type InstitutionInput = {
  contractNumber: string
  name: string
  observations?: string
  events: InstitutionEventInput[]
}

// Extended params for institutions
export type InstitutionPaginationParams = {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  order?: "asc" | "desc"
}

// API functions
export async function fetchInstitutions(params: InstitutionPaginationParams = {}): Promise<Institution[]> {
  const { page = 1, limit = 10, search, sortBy, order } = params

  // Construir os parâmetros de consulta
  const queryParams = new URLSearchParams()
  queryParams.append("page", page.toString())
  queryParams.append("limit", limit.toString())

  if (search && search.trim() !== "") {
    queryParams.append("search", search.trim())
  }

  if (sortBy) {
    queryParams.append("sortBy", sortBy)
  }

  if (order) {
    queryParams.append("order", order)
  }

  const response = await api.get(`/v1/institutions?${queryParams.toString()}`)
  return response.data.data || []
}

export async function fetchInstitutionById(id: string): Promise<Institution> {
  const response = await api.get(`/v1/institutions/${id}`)
  return response.data
}

export async function createInstitution(
  institutionData: InstitutionInput,
): Promise<Institution> {
  const response = await api.post("/v1/institutions", institutionData)
  return response.data
}

export async function updateInstitution(
  id: string,
  institutionData: Partial<InstitutionInput>,
): Promise<Institution> {
  // Remover o campo 'id' do institutionData se ele existir
  const { id: _, ...dataWithoutId } = institutionData as any

  const response = await api.put(`/v1/institutions/${id}`, dataWithoutId)
  return response.data
}

export async function deleteInstitution(id: string): Promise<void> {
  await api.delete(`/v1/institutions/${id}`)
}

// Type for send credentials response
export type SendCredentialsResponse = {
  totalStudents: number
  credentialsSent: number
  failedEmails: number
  errors: {
    studentId: string
    email: string
    error: string
  }[]
}

// Send welcome credentials to users who haven't accessed the platform
export async function sendCredentials(institutionId: string): Promise<SendCredentialsResponse> {
  const response = await api.post(`/v1/institutions/${institutionId}/send-credentials`)
  return response.data
}

// Type for delete event response
export type DeleteEventResponse = {
  success: boolean
  message: string
}

// Delete a specific event from an institution
export async function deleteInstitutionEvent(eventId: string): Promise<DeleteEventResponse> {
  const response = await api.delete(`/v1/institutions/events/${eventId}`)
  return response.data
}
