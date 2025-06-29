"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react"

interface UserCardProps {
  user: {
    id: string
    name: string
    identifier: string
    email: string
    role: "admin" | "client"
    userContract: string
    profileImage?: string
  }
  onDelete: (id: string) => void
}

export function UserCard({ user, onDelete }: UserCardProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between rounded-md border p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <div className="font-semibold">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="text-sm text-muted-foreground">Contrato: {user.userContract}</div>
          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="w-fit">
            {user.role === "admin" ? "Administrador" : "Cliente"}
          </Badge>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/upload-photos`)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload de Fotos
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(user.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}