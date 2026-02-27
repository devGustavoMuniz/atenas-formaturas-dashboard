"use client"

import { useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { CartItemCard } from "@/components/cart/cart-item-card"
import { ShoppingCart, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export function CartSheet() {
  const { items, selectedItemIds, toggleItemSelection, clearCart, isOpen, setCartOpen, fetchCart, isSyncing } = useCartStore((state) => state)
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const selectedCount = items.filter(item => selectedItemIds.has(item.id)).length
  const router = useRouter()
  const previousIsOpen = useRef(false)

  useEffect(() => {
    if (isOpen && !previousIsOpen.current) {
      fetchCart()
    }
    previousIsOpen.current = isOpen
  }, [isOpen, fetchCart])

  const subtotal = items
    .filter(item => selectedItemIds.has(item.id))
    .reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0)

  const handleCheckout = () => {
    router.push("/checkout")
    setCartOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetTrigger asChild>
        <Button id="cart-trigger" variant="ghost" size="icon" className="relative">
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
          {isSyncing && items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, index) => (
                <CartItemCard
                  key={`${item.id}-${index}`}
                  item={item}
                  isSelected={selectedItemIds.has(item.id)}
                  onToggleSelection={() => toggleItemSelection(item.id)}
                />
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
            <div className="flex flex-col items-center gap-2">
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={selectedCount === 0}>
                {selectedCount > 0 && selectedCount < items.length
                  ? `Finalizar ${selectedCount} ${selectedCount === 1 ? 'item' : 'itens'}`
                  : 'Finalizar Compra'}
              </Button>
              <Button variant="ghost" onClick={clearCart} className="text-sm">
                Limpar Carrinho
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
