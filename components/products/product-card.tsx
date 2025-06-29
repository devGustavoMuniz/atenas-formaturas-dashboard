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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductFlag } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  onDelete: (id: string) => void
}

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-2 rounded-md border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{product.name}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/products/${product.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(product.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Badge variant="outline" className="w-fit">
        {ProductFlag[product.flag]}
      </Badge>
      <div className="text-sm text-muted-foreground line-clamp-2">
        {product.description || "Sem descrição."}
      </div>
      <div className="text-xs text-muted-foreground">
        Criado em: {new Date(product.createdAt).toLocaleDateString("pt-BR")}
      </div>
    </div>
  )
}