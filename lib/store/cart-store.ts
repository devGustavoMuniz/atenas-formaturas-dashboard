"use client"

import { create } from "zustand"
import type { CartItem, CartItemSelection } from "@/lib/cart-types"

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  incrementItem: (itemId: string) => void
  decrementItem: (itemId: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
}

// Helper to compare selections
function areSelectionsEqual(a: CartItemSelection, b: CartItemSelection): boolean {
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

import { persist, createJSONStorage } from "zustand/middleware"

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addToCart: (newItem) => set((state) => {
        const existingItemIndex = state.items.findIndex(
          (item) => item.product.id === newItem.product.id && areSelectionsEqual(item.selection, newItem.selection)
        )

        if (existingItemIndex > -1) {
          const newItems = [...state.items]
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + newItem.quantity
          }
          return { items: newItems }
        }

        return { items: [...state.items, newItem] }
      }),
      removeFromCart: (itemId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),
      incrementItem: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
          ),
        })),
      decrementItem: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      setCartOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Persist only items, not isOpen
    }
  )
)
