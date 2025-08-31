"use client"

import type { CartItem } from "@/lib/cart-types"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { Trash2 } from "lucide-react"

interface CartItemCardProps {
  item: CartItem
}

function getSelectionSummary(item: CartItem): string {
  switch (item.selection.type) {
    case "ALBUM":
      return `${item.selection.selectedPhotos.length} fotos selecionadas`
    case "DIGITAL_FILES_PACKAGE":
      if (item.selection.isPackageComplete) {
        return "Pacote completo"
      }
      return `${item.selection.selectedEvents.length} eventos selecionados`
    case "GENERIC":
    case "DIGITAL_FILES_UNIT":
      const photoCount = Object.values(item.selection.selectedPhotos).reduce(
        (total, photos) => total + photos.length,
        0
      )
      return `${photoCount} fotos selecionadas`
    default:
      return "Detalhes da seleção não disponíveis"
  }
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { removeFromCart } = useCartStore()

  return (
    <div className="flex items-start justify-between p-4 border-b">
      <div>
        <p className="font-semibold">{item.product.name}</p>
        <p className="text-sm text-muted-foreground">{getSelectionSummary(item)}</p>
        <p className="text-lg font-bold">{formatCurrency(item.totalPrice)}</p>
      </div>
      <Button variant="destructive" size="icon" onClick={() => removeFromCart(item.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}