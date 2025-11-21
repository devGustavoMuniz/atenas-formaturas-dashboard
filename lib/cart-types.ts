import type { Product } from "@/lib/types"
import type { InstitutionProduct } from "@/lib/api/institution-products-api"

// Define os tipos de seleção que um item do carrinho pode ter
export type CartItemSelection = 
  | { type: 'ALBUM'; selectedPhotos: string[] }
  | { type: 'GENERIC'; selectedPhotos: Record<string, string[]> } // eventId -> photoId[]
  | { type: 'DIGITAL_FILES_PACKAGE'; selectedEvents: string[]; isPackageComplete: boolean }
  | { type: 'DIGITAL_FILES_UNIT'; selectedPhotos: Record<string, string[]> } // eventId -> photoId[]

export interface CartItem {
  id: string // ID único para o item no carrinho (e.g., timestamp)
  product: Product
  institutionProduct: InstitutionProduct
  selection: CartItemSelection
  totalPrice: number
  quantity: number
}
