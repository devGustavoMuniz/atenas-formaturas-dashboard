"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  const users = mockRecentUsers

  return (
    <div className="space-y-8">
      {users.map((user) => (
        <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="mt-2 sm:ml-4 sm:mt-0 space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          
        </div>
      ))}
    </div>
  )
}
