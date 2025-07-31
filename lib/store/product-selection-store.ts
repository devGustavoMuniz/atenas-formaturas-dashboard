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
  setSelectedProduct: (product: Product, institutionProduct: InstitutionProduct) => void
  setSelectedPhoto: (photoId: string, isSelected: boolean) => void
  setSelectedEvent: (eventId: string, isSelected: boolean) => void
  setPackageComplete: (isComplete: boolean) => void
  clearSelection: () => void
  clearSelections: () => void
}

export const useProductSelectionStore = create<ProductSelectionState>((set) => ({
  product: null,
  institutionProduct: null,
  selectedPhotos: {},
  selectedEvents: {},
  isPackageComplete: false,
  setSelectedProduct: (product, institutionProduct) =>
    set({
      product,
      institutionProduct,
      selectedPhotos: {},
      selectedEvents: {},
      isPackageComplete: false,
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
  clearSelection: () =>
    set({
      product: null,
      institutionProduct: null,
      selectedPhotos: {},
      selectedEvents: {},
      isPackageComplete: false,
    }),
  clearSelections: () => set({ selectedPhotos: {}, selectedEvents: {}, isPackageComplete: false }),
}))
