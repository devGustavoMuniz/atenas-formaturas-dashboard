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

// Mock data for demonstration
const mockInstitutions: Institution[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `inst-${i + 1}`,
  contractNumber: `CONT-${1000 + i}`,
  name: `Instituição ${i + 1}`,
  observations: `Observações sobre a instituição ${i + 1}. ${
    Math.random() > 0.5 ? "Cliente desde 2020." : "Novo cliente."
  }`,
  events: Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map(
    (_, j) => `Evento ${j + 1} da Instituição ${i + 1}`,
  ),
  userCount: Math.floor(Math.random() * 100) + 10,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}))

// API functions
export async function fetchInstitutions(): Promise<Institution[]> {
  // In a real app, you would make an API call
  // return api.get("/institutions").then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockInstitutions)
    }, 500)
  })
}

export async function fetchInstitutionById(id: string): Promise<Institution> {
  // In a real app, you would make an API call
  // return api.get(`/institutions/${id}`).then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const institution = mockInstitutions.find((i) => i.id === id)
      if (institution) {
        resolve(institution)
      } else {
        reject(new Error("Institution not found"))
      }
    }, 500)
  })
}

export async function createInstitution(
  institutionData: Omit<Institution, "id" | "createdAt" | "userCount">,
): Promise<Institution> {
  // In a real app, you would make an API call
  // return api.post("/institutions", institutionData).then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const newInstitution: Institution = {
        id: `inst-${mockInstitutions.length + 1}`,
        ...institutionData,
        userCount: Math.floor(Math.random() * 50),
        createdAt: new Date().toISOString(),
      }
      mockInstitutions.push(newInstitution)
      resolve(newInstitution)
    }, 500)
  })
}

export async function updateInstitution(id: string, institutionData: Partial<Institution>): Promise<Institution> {
  // In a real app, you would make an API call
  // return api.put(`/institutions/${id}`, institutionData).then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockInstitutions.findIndex((i) => i.id === id)
      if (index !== -1) {
        mockInstitutions[index] = { ...mockInstitutions[index], ...institutionData }
        resolve(mockInstitutions[index])
      } else {
        reject(new Error("Institution not found"))
      }
    }, 500)
  })
}

export async function deleteInstitution(id: string): Promise<void> {
  // In a real app, you would make an API call
  // return api.delete(`/institutions/${id}`).then(res => res.data)

  // For demo purposes, simulate deletion
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockInstitutions.findIndex((i) => i.id === id)
      if (index !== -1) {
        mockInstitutions.splice(index, 1)
        resolve()
      } else {
        reject(new Error("Institution not found"))
      }
    }, 500)
  })
}
