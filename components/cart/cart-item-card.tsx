"use client"

import type { CartItem } from "@/lib/cart-types"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { Trash2, Minus, Plus } from "lucide-react"

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
  const { removeFromCart, incrementItem, decrementItem } = useCartStore()

  return (
    <div className="flex items-start justify-between p-4 border-b">
      <div className="flex-1">
        <p className="font-semibold">{item.product.name}</p>
        <p className="text-sm text-muted-foreground mb-2">{getSelectionSummary(item)}</p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => decrementItem(item.id)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => incrementItem(item.id)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="text-lg font-bold">{formatCurrency(item.totalPrice * item.quantity)}</p>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}