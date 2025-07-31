"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { CartItemCard } from "@/components/cart/cart-item-card"
import { ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useState } from "react"

const CartItemCardPlaceholder = ({ name }: { name: string }) => (
  <div className="flex justify-between items-center p-2 border-b">
    <span>{name}</span>
    <Button variant="destructive" size="sm">Remover</Button>
  </div>
)

export function CartSheet() {
  const { items, clearCart } = useCartStore((state) => state)
  const itemCount = items.length
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0)

  const handleCheckout = () => {
    router.push("/checkout")
    setIsSheetOpen(false)
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-2"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Meu Carrinho</SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Seu carrinho está vazio.</p>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={clearCart}>
                Limpar Carrinho
              </Button>
              <Button className="w-full" onClick={handleCheckout}>
                Finalizar Compra
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
