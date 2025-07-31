"use client"

import { create } from "zustand"
import type { CartItem } from "@/lib/cart-types"

interface CartState {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addToCart: (item) => set((state) => ({ items: [...state.items, item] })),
  removeFromCart: (itemId) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),
  clearCart: () => set({ items: [] }),
}))
