"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"

interface ClientProductCardProps {
  product: Product
}

export function ClientProductCard({ product }: ClientProductCardProps) {
  const router = useRouter()

  const handleProductClick = () => {
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
      >
        Ver Detalhes
      </Button>
    </div>
  )
}
