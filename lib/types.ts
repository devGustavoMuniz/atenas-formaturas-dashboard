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
  flag: "ALBUM" | "GENERIC" | "DIGITAL_FILES" // 'category' foi substituída por 'flag'
  description: string
  photos: string[]
  video?: string[] // 'videos' foi renomeado para 'video'
  createdAt: string
}