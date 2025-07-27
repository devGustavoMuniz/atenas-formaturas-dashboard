"use client"

import { create } from "zustand"
import type { Product } from "@/lib/types"
import type { InstitutionProduct } from "@/lib/api/institution-products-api"

interface ProductSelectionState {
  product: Product | null
  institutionProduct: InstitutionProduct | null
  setSelectedProduct: (product: Product, institutionProduct: InstitutionProduct) => void
  clearSelection: () => void
}

export const useProductSelectionStore = create<ProductSelectionState>((set) => ({
  product: null,
  institutionProduct: null,
  setSelectedProduct: (product, institutionProduct) => set({ product, institutionProduct }),
  clearSelection: () => set({ product: null, institutionProduct: null }),
}))
