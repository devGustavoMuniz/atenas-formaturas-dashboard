"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { useAuthStore } from "@/lib/store/auth-store"
import { useProductSelectionStore } from "@/lib/store/product-selection-store"
import { fetchInstitutionProducts } from "@/lib/api/institution-products-api"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ClientProductCardProps {
  product: Product
}

export function ClientProductCard({ product }: ClientProductCardProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const setSelectedProduct = useProductSelectionStore(
    (state) => state.setSelectedProduct
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleProductClick = async () => {
      router.push(`/client/products/${product.id}`)
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-4 shadow-sm">
      <div className="relative w-full aspect-square">
        <Image
          src={product.photos[0] || "/placeholder.jpg"}
          alt={product.name}
          fill
          className="rounded-md object-cover"
        />
      </div>
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {product.description || "Sem descrição."}
      </p>
      <Button
        onClick={handleProductClick}
        className="mt-auto"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : product.flag === "DIGITAL_FILES" ? (
          "Selecionar Fotos"
        ) : (
          "Ver Detalhes"
        )}
      </Button>
    </div>
  )
}
