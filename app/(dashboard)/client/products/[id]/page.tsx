"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { fetchProductById } from "@/lib/api/products-api"
import { fetchInstitutionProducts, type InstitutionProduct } from "@/lib/api/institution-products-api"
import { useAuthStore } from "@/lib/store/auth-store"
import type { Product } from "@/lib/types"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailsPage() {
  const { id: productId } = useParams<{ id: string }>()
  const user = useAuthStore((state) => state.user)

  const [product, setProduct] = useState<Product | null>(null)
  const [institutionProduct, setInstitutionProduct] = useState<InstitutionProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId || !user) {
      return
    }

    if (!user.institutionId) {
      setError("Usuário não associado a uma instituição.")
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const productData = await fetchProductById(productId)
        setProduct(productData)

        const institutionProductsData = await fetchInstitutionProducts(user.institutionId)
        const specificInstitutionProduct = institutionProductsData.find(
          (instProduct) => instProduct.product.id === productId
        )

        if (specificInstitutionProduct) {
          setInstitutionProduct(specificInstitutionProduct)
        } else {
          setError("Detalhes específicos para este produto não encontrados para sua instituição.")
        }
      } catch (err) {
        console.error("Falha ao carregar os detalhes do produto:", err)
        setError("Falha ao carregar os detalhes do produto.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId, user])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <Skeleton className="h-[400px] w-full rounded-lg md:h-[500px]" />
            <div className="mt-4 flex justify-center space-x-2">
              <Skeleton className="h-2 w-10" />
              <Skeleton className="h-2 w-10" />
              <Skeleton className="h-2 w-10" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Separator className="my-4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/2" />
            <Button className="mt-auto w-full" disabled>
              Carregando...
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">{error}</div>
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-8 text-center">Produto não encontrado.</div>
  }

  const renderDetail = (key: string, value: any, label?: string) => {
    const formattedKey = label || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    let displayValue = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value;

    // Formatar valores específicos como moeda (Real Brasileiro)
    if (typeof value === 'number' && (key === 'valorFoto' || key === 'valorPhoto' || key === 'valorEncadernacao')) {
      displayValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    } else if (typeof value === 'number' && (key === 'minPhoto' || key === 'maxPhoto' || key === 'minPhotos')) {
      // Adicionar sufixo "foto" ou "fotos"
      displayValue = `${value} ${value === 1 ? 'foto' : 'fotos'}`;
    }

    return (
      <div key={key} className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">{formattedKey}:</span>
        <span>{displayValue}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        {/* Coluna do Carrossel */}
        <div className="w-full">
          <Carousel className="w-full">
            <CarouselContent>
              {product.photos && product.photos.length > 0 ? (
                product.photos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <Card className="overflow-hidden">
                      <CardContent className="relative aspect-square p-0">
                        <Image
                          src={photo}
                          alt={`${product.name} - Foto ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                  <Card>
                    <CardContent className="relative aspect-square p-0">
                       <Image
                          src="/placeholder.jpg"
                          alt="Placeholder"
                          fill
                          className="object-cover"
                        />
                    </CardContent>
                  </Card>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>

        {/* Coluna de Informações */}
        <div className="flex flex-col py-4 md:py-0">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          {institutionProduct?.details && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Detalhes da Compra</h3>
                {product.flag === "ALBUM" && (
                  <>
                    {institutionProduct.details.minPhoto && renderDetail("minPhoto", institutionProduct.details.minPhoto, "Mínimo de Fotos")}
                    {institutionProduct.details.maxPhoto && renderDetail("maxPhoto", institutionProduct.details.maxPhoto, "Máximo de Fotos")}
                    {institutionProduct.details.valorEncadernacao && renderDetail("valorEncadernacao", institutionProduct.details.valorEncadernacao, "Valor da Encadernação")}
                    {institutionProduct.details.valorFoto && renderDetail("valorFoto", institutionProduct.details.valorFoto, "Valor por Foto")}
                  </>
                )}
                {(product.flag === "GENERIC" || product.flag === "DIGITAL_FILES") && institutionProduct.details.events?.length > 0 && (
                  <>
                    {institutionProduct.details.events[0].minPhotos && renderDetail("minPhotos", institutionProduct.details.events[0].minPhotos, "Mínimo de Fotos")}
                    {institutionProduct.details.events[0].valorPhoto && renderDetail("valorPhoto", institutionProduct.details.events[0].valorPhoto, "Valor por Foto")}
                  </>
                )}
              </div>
              <Separator className="my-6" />
            </>
          )}

          <p className="mt-4 text-muted-foreground flex-1">
            {product.description || "Sem descrição detalhada."}
          </p>

          <Button size="lg" className="mt-6 w-full">
            Adquirir Produto
          </Button>
        </div>
      </div>
    </div>
  )
}
