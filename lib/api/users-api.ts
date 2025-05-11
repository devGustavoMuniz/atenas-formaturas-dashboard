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

// Mock data for demonstration
const mockUsers: User[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `user-${i + 1}`,
  name: `Usuário ${i + 1}`,
  identifier: `ID-${1000 + i}`,
  email: `usuario${i + 1}@exemplo.com`,
  phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
  observations: Math.random() > 0.5 ? `Observações sobre o usuário ${i + 1}` : undefined,
  role: Math.random() > 0.5 ? "admin" : "client",
  institutionId: `inst-${Math.floor(Math.random() * 8) + 1}`,
  fatherName: Math.random() > 0.6 ? `Pai do Usuário ${i + 1}` : undefined,
  fatherPhone:
    Math.random() > 0.6
      ? `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
      : undefined,
  motherName: Math.random() > 0.6 ? `Mãe do Usuário ${i + 1}` : undefined,
  motherPhone:
    Math.random() > 0.6
      ? `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
      : undefined,
  driveLink: Math.random() > 0.7 ? `https://drive.google.com/drive/folders/abc${i}` : undefined,
  creditValue: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) + 100 : undefined,
  profileImage: Math.random() > 0.5 ? `user-${i + 1}.jpg` : undefined,
  status: Math.random() > 0.3 ? "active" : "inactive",
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
}))

// API functions
export async function fetchUsers(): Promise<User[]> {
  // In a real app, you would make an API call
  // return api.get("/api/users").then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUsers)
    }, 500)
  })
}

export async function fetchUserById(id: string): Promise<User> {
  // In a real app, you would make an API call
  // return api.get(`/api/users/${id}`).then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.id === id)
      if (user) {
        resolve(user)
      } else {
        reject(new Error("User not found"))
      }
    }, 500)
  })
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  // In a real app, you would make an API call
  // return api.post("/api/users", userData).then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser: User = {
        id: `user-${mockUsers.length + 1}`,
        ...userData,
        createdAt: new Date().toISOString(),
      }
      mockUsers.push(newUser)
      resolve(newUser)
    }, 500)
  })
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  // In a real app, you would make an API call
  // return api.put(`/api/users/${id}`, userData).then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...userData }
        resolve(mockUsers[index])
      } else {
        reject(new Error("User not found"))
      }
    }, 500)
  })
}

export async function deleteUser(id: string): Promise<void> {
  // In a real app, you would make an API call
  // return api.delete(`/api/users/${id}`).then(res => res.data)

  // For demo purposes, simulate deletion
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index !== -1) {
        mockUsers.splice(index, 1)
        resolve()
      } else {
        reject(new Error("User not found"))
      }
    }, 500)
  })
}

export async function fetchRecentUsers(): Promise<User[]> {
  // In a real app, you would make an API call
  // return api.get("/api/users/recent").then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const sortedUsers = [...mockUsers].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      resolve(sortedUsers.slice(0, 5))
    }, 500)
  })
}

export async function fetchUserStats(): Promise<UserStats> {
  // In a real app, you would make an API call
  // return api.get("/api/users/stats").then(res => res.data)

  // For demo purposes, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = mockUsers.length
      const active = mockUsers.filter((u) => u.status === "active").length
      const inactive = total - active

      resolve({
        total,
        new: Math.floor(total * 0.3),
        active,
        inactive,
        growthRate: 12,
        newGrowthRate: 8,
        activeGrowthRate: 5,
        inactiveGrowthRate: -3,
      })
    }, 500)
  })
}

// Função para obter URL presigned para upload de imagem
export async function getPresignedUrl({
  contentType,
}: { contentType: string }): Promise<{ uploadUrl: string; filename: string }> {
  // Em uma aplicação real, você faria uma chamada para a API
  // return api.post("/api/presigned-url", { contentType }).then(res => res.data)

  // Para fins de demonstração, simular uma resposta
  return new Promise((resolve) => {
    setTimeout(() => {
      const filename = `user-${Date.now()}.${contentType.split("/")[1]}`
      resolve({
        uploadUrl: `https://storage.googleapis.com/bucket-name/${filename}`,
        filename: filename,
      })
    }, 500)
  })
}
