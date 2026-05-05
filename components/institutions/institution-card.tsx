"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import type { Institution } from "@/lib/api/institutions-api"

interface InstitutionCardProps {
  institution: Institution
  onDelete: (id: string) => void
}

export function InstitutionCard({ institution, onDelete }: InstitutionCardProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">{institution.name}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:bg-white/5 hover:text-yellow-300">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/institutions/${institution.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(institution.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="text-sm text-zinc-400">Contrato: {institution.contractNumber}</div>
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Users className="h-4 w-4 text-yellow-300" />
        <span>{institution.userCount} usuários</span>
      </div>
      <Badge variant="outline" className="w-fit border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
        {institution.events.length} eventos
      </Badge>
      <div className="text-xs text-zinc-500">
        Criado em: {new Date(institution.createdAt).toLocaleDateString("pt-BR")}
      </div>
    </div>
  )
}
