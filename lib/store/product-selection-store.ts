"use client"

import { create } from "zustand"
import type { Product } from "@/lib/types"
import type { InstitutionProduct } from "@/lib/api/institution-products-api"

interface ProductSelectionState {
  product: Product | null
  institutionProduct: InstitutionProduct | null
  selectedPhotos: Record<string, boolean>
  selectedEvents: Record<string, boolean>
  isPackageComplete: boolean
  quantity: number
  setSelectedProduct: (product: Product, institutionProduct: InstitutionProduct) => void
  setSelectedPhoto: (photoId: string, isSelected: boolean) => void
  setSelectedEvent: (eventId: string, isSelected: boolean) => void
  setPackageComplete: (isComplete: boolean) => void
  setQuantity: (quantity: number) => void
  clearSelection: () => void
  clearSelections: () => void
}

export const useProductSelectionStore = create<ProductSelectionState>((set) => ({
  product: null,
  institutionProduct: null,
  selectedPhotos: {},
  selectedEvents: {},
  isPackageComplete: false,
  quantity: 1,
  setSelectedProduct: (product, institutionProduct) =>
    set({
      product,
      institutionProduct,
      selectedPhotos: {},
      selectedEvents: {},
      isPackageComplete: false,
      quantity: 1,
    }),
  setSelectedPhoto: (photoId, isSelected) =>
    set((state) => ({
      selectedPhotos: {
        ...state.selectedPhotos,
        [photoId]: isSelected,
      },
    })),
  setSelectedEvent: (eventId, isSelected) =>
    set((state) => {
      const newSelectedEvents = { ...state.selectedEvents, [eventId]: isSelected }
      if (isSelected) {
        return { selectedEvents: newSelectedEvents, isPackageComplete: false }
      }
      return { selectedEvents: newSelectedEvents }
    }),
  setPackageComplete: (isComplete) =>
    set(() => {
      if (isComplete) {
        return { isPackageComplete: true, selectedEvents: {} }
      }
      return { isPackageComplete: false }
    }),
  setQuantity: (quantity) =>
    set({ quantity: Math.max(1, quantity) }),
  clearSelection: () =>
    set({
      product: null,
      institutionProduct: null,
      selectedPhotos: {},
      selectedEvents: {},
      isPackageComplete: false,
      quantity: 1,
    }),
  clearSelections: () => set({ selectedPhotos: {}, selectedEvents: {}, isPackageComplete: false, quantity: 1 }),
}))
