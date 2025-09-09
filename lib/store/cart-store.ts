"use client"

import { create } from "zustand"
import type { CartItem } from "@/lib/cart-types"

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  addToCart: (item) => set((state) => ({ items: [...state.items, item] })),
  removeFromCart: (itemId) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),
  clearCart: () => set({ items: [] }),
  setCartOpen: (open) => set({ isOpen: open }),
}))
