export type User = {
  id: string
  name: string
  identifier: string
  email: string
  phone: string
  observations?: string
  role: "admin" | "client"
  institutionId: string
  userContract: string
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

export type Product = {
  id: string
  name: string
  category: "Álbum" | "Produto com seleção de fotos" | "Arquivos digitais"
  description: string
  photos: string[] // Array de URLs ou nomes de arquivos
  videos?: string[] // Array de URLs ou nomes de arquivos (opcional)
  createdAt: string
}