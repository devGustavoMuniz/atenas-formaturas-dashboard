"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth/use-auth"
import { fetchInstitutionProducts } from "@/lib/api/institution-products-api"
import { fetchProductById } from "@/lib/api/products-api"
import { ClientProductCard } from "@/components/products/client-product-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientProductsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client-products", user?.institutionId],
    queryFn: async () => {
      const institutionProducts = await fetchInstitutionProducts(user!.institutionId)
      return Promise.all(
        institutionProducts.map((ip) => fetchProductById(ip.product.id))
      )
    },
    enabled: !!user?.institutionId,
  })

  if (isAuthLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-square" />
        ))}
      </div>
    )
  }

  if (!user?.institutionId) {
    return <div className="text-center text-red-500">User is not associated with an institution.</div>
  }

  if (isError) {
    return <div className="text-center text-red-500">Failed to load products. Please try again later.</div>
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
