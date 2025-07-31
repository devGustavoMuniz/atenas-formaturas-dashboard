"use client"

import { create } from "zustand"
import type { Product } from "@/lib/types"
import type { InstitutionProduct } from "@/lib/api/institution-products-api"

interface ProductSelectionState {
  product: Product | null
  institutionProduct: InstitutionProduct | null
  selectedPhotos: Record<string, boolean>
  setSelectedProduct: (product: Product, institutionProduct: InstitutionProduct) => void
  setSelectedPhoto: (photoId: string, isSelected: boolean) => void
  clearSelection: () => void
  clearPhotosSelection: () => void
}

export const useProductSelectionStore = create<ProductSelectionState>((set) => ({
  product: null,
  institutionProduct: null,
  selectedPhotos: {},
  setSelectedProduct: (product, institutionProduct) => set({ product, institutionProduct }),
  setSelectedPhoto: (photoId, isSelected) =>
    set((state) => ({
      selectedPhotos: {
        ...state.selectedPhotos,
        [photoId]: isSelected,
      },
    })),
  clearSelection: () => set({ product: null, institutionProduct: null, selectedPhotos: {} }),
  clearPhotosSelection: () => set({ selectedPhotos: {} }),
}))
