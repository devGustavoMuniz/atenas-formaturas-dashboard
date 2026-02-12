"use client"

import { create } from "zustand"
import type { CartItem, CartItemSelection } from "@/lib/cart-types"
import { getCart, syncCart, deleteCart } from "@/lib/api/cart-api"

type CartState = {
  items: CartItem[]
  isOpen: boolean
  isSyncing: boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  incrementItem: (itemId: string) => void
  decrementItem: (itemId: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  fetchCart: () => Promise<void>
}

function areSelectionsEqual(a: CartItemSelection, b: CartItemSelection): boolean {
  if (!a || !b) return false
  if (a.type !== b.type) return false

  if (a.type === 'ALBUM' && b.type === 'ALBUM') {
    if (a.selectedPhotos.length !== b.selectedPhotos.length) return false
    const sortedA = [...a.selectedPhotos].sort()
    const sortedB = [...b.selectedPhotos].sort()
    return sortedA.every((val, index) => val === sortedB[index])
  }

  if (a.type === 'DIGITAL_FILES_PACKAGE' && b.type === 'DIGITAL_FILES_PACKAGE') {
    if (a.isPackageComplete !== b.isPackageComplete) return false
    if (a.selectedEvents.length !== b.selectedEvents.length) return false
    const sortedA = [...a.selectedEvents].sort()
    const sortedB = [...b.selectedEvents].sort()
    return sortedA.every((val, index) => val === sortedB[index])
  }

  if ((a.type === 'GENERIC' && b.type === 'GENERIC') ||
    (a.type === 'DIGITAL_FILES_UNIT' && b.type === 'DIGITAL_FILES_UNIT')) {
    const keysA = Object.keys(a.selectedPhotos).sort()
    const keysB = Object.keys(b.selectedPhotos).sort()
    if (keysA.length !== keysB.length) return false
    if (!keysA.every((key, index) => key === keysB[index])) return false

    return keysA.every(key => {
      const photosA = [...a.selectedPhotos[key]].sort()
      const photosB = [...b.selectedPhotos[key]].sort()
      if (photosA.length !== photosB.length) return false
      return photosA.every((val, index) => val === photosB[index])
    })
  }

  return false
}

function syncToBackend(items: CartItem[]): void {
  syncCart(items).catch((error) => {
    console.error("Falha ao sincronizar carrinho com o backend:", error)
  })
}

export const useCartStore = create<CartState>()(
  (set, get) => ({
    items: [],
    isOpen: false,
    isSyncing: false,

    fetchCart: async () => {
      set({ isSyncing: true })
      try {
        const response = await getCart()
        const validItems = (response.items || []).filter(item => item && item.product && item.selection)
        set({ items: validItems })
      } catch (error) {
        console.error("Falha ao buscar carrinho do backend:", error)
      } finally {
        set({ isSyncing: false })
      }
    },

    addToCart: (newItem) => {
      set((state) => {
        const existingItemIndex = state.items.findIndex(
          (item) => item?.product?.id === newItem?.product?.id && areSelectionsEqual(item?.selection, newItem?.selection)
        )

        let newItems: CartItem[]
        if (existingItemIndex > -1) {
          newItems = [...state.items]
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + newItem.quantity
          }
        } else {
          newItems = [...state.items, newItem]
        }

        syncToBackend(newItems)
        return { items: newItems }
      })
    },

    removeFromCart: (itemId) => {
      const newItems = get().items.filter((item) => item.id !== itemId)
      set({ items: newItems })
      syncToBackend(newItems)
    },

    incrementItem: (itemId) => {
      const newItems = get().items.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
      set({ items: newItems })
      syncToBackend(newItems)
    },

    decrementItem: (itemId) => {
      const newItems = get().items.map((item) =>
        item.id === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      set({ items: newItems })
      syncToBackend(newItems)
    },

    clearCart: () => {
      set({ items: [] })
      deleteCart().catch((error) => {
        console.error("Falha ao limpar carrinho no backend:", error)
      })
    },

    setCartOpen: (open) => set({ isOpen: open }),
  })
)
