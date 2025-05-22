"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Dados mockados para substituir a chamada de API
const mockRecentUsers = [
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
]

export function RecentUsers() {
  // Usar dados mockados em vez de fazer chamada de API
  const users = mockRecentUsers

  return (
    <div className="space-y-8">
      {users.map((user) => (
        <div key={user.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="ml-auto font-medium">{new Date(user.createdAt).toLocaleDateString("pt-BR")}</div>
        </div>
      ))}
    </div>
  )
}
