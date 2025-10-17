"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/use-auth"
import { fetchInstitutionProducts } from "@/lib/api/institution-products-api"
import { fetchProductById } from "@/lib/api/products-api"
import { ClientProductCard } from "@/components/products/client-product-card"
import { Product } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getProducts() {
      if (!user?.institutionId) {
        setError("User is not associated with an institution.")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const institutionProducts = await fetchInstitutionProducts(user.institutionId)
        const detailedProducts = await Promise.all(
          institutionProducts.map(async (ip) => {
            const productDetails = await fetchProductById(ip.product.id)
            return productDetails
          })
        )
        setProducts(detailedProducts)
      } catch (err) {
        console.error("Failed to fetch institution products:", err)
        setError("Failed to load products. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    getProducts()
  }, [user?.institutionId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-square" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  if (products.length === 0) {
    return <div className="text-center text-muted-foreground">Nenhum produto disponível para sua instituição.</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ClientProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
