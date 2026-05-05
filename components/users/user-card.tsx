"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, Upload } from "lucide-react"
import type { User } from "@/lib/types"

interface UserCardProps {
  user: User
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

export function UserCard({ user, onView, onEdit, onDelete }: UserCardProps) {
  const router = useRouter()

  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm transition-colors hover:bg-white/[0.06]"
      onClick={() => onView(user)}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 ring-1 ring-yellow-400/20">
          <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <div className="font-semibold text-white">{user.name}</div>
          <div className="text-sm text-zinc-400">{user.email}</div>
          <div className="text-sm text-zinc-400">Contrato: {user.userContract}</div>
          <Badge variant="outline" className={user.role === "admin" ? "w-fit border-yellow-400/40 bg-yellow-400/15 text-yellow-200" : "w-fit border-white/10 bg-white/10 text-zinc-200"}>
            {user.role === "admin" ? "Administrador" : "Cliente"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
          onClick={() => onView(user)}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
          onClick={() => onEdit(user)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
          onClick={() => router.push(`/users/${user.id}/upload-photos`)}
        >
          <Upload className="h-4 w-4" />
          <span className="sr-only">Upload de fotos</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={() => onDelete(user.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </div>
    </div>
  )
}
