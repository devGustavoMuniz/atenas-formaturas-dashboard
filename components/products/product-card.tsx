"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductFlag } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductCard({ product, onView, onEdit, onDelete }: ProductCardProps) {
  return (
    <div
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm transition-colors hover:bg-white/[0.06]"
      onClick={() => onView(product)}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">{product.name}</div>
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
            onClick={() => onView(product)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </div>
      <Badge variant="outline" className="w-fit border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
        {ProductFlag[product.flag]}
      </Badge>
      <div className="line-clamp-2 text-sm text-zinc-400">
        {product.description || "Sem descrição."}
      </div>
      <div className="text-xs text-zinc-500">
        Criado em: {new Date(product.createdAt).toLocaleDateString("pt-BR")}
      </div>
    </div>
  )
}
