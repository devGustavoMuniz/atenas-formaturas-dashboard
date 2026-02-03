"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import Autoplay from "embla-carousel-autoplay"
import { fetchProductById } from "@/lib/api/products-api"
import {
  fetchInstitutionProducts,
  type InstitutionProduct,
} from "@/lib/api/institution-products-api"
import { useAuthStore } from "@/lib/store/auth-store"
import { useProductSelectionStore } from "@/lib/store/product-selection-store"
import type { Product } from "@/lib/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Image as ImageIcon, DollarSign } from "lucide-react"

export default function ProductDetailsPage() {
  const { id: productId } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const setSelectedProduct = useProductSelectionStore(
    (state) => state.setSelectedProduct
  )

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const [product, setProduct] = useState<Product | null>(null)
  const [institutionProduct, setInstitutionProduct] =
    useState<InstitutionProduct | null>(null)
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

        const institutionProductsData = await fetchInstitutionProducts(
          user.institutionId
        )
        const specificInstitutionProduct = institutionProductsData.find(
          (instProduct) => instProduct.product.id === productId
        )

        if (specificInstitutionProduct) {
          setInstitutionProduct(specificInstitutionProduct)
        } else {
          setError(
            "Detalhes específicos para este produto não encontrados para sua instituição."
          )
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

  const handleAcquireProduct = () => {
    if (product && institutionProduct) {
      setSelectedProduct(product, institutionProduct)
      router.push(`/client/products/${productId}/select-photos`)
    }
  }

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
            <Skeleton className="h-6 w-1/s4" />
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
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        {error}
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Produto não encontrado.
      </div>
    )
  }

  const renderDetail = (key: string, value: any, label?: string) => {
    const formattedKey =
      label ||
      key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
    let displayValue = typeof value === "boolean" ? (value ? "Sim" : "Não") : value

    // Formatar valores específicos como moeda (Real Brasileiro)
    if (
      typeof value === "number" &&
      (key === "valorFoto" ||
        key === "valorPhoto" ||
        key === "valorEncadernacao")
    ) {
      displayValue = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)
    } else if (
      typeof value === "number" &&
      (key === "minPhoto" || key === "minPhotos")
    ) {
      // Adicionar sufixo "foto" ou "fotos" para mínimo
      displayValue = value > 0 ? `${value} ${value === 1 ? "foto" : "fotos"}` : "Sem mínimo"
    } else if (
      typeof value === "number" &&
      (key === "maxPhoto" || key === "maxPhotos")
    ) {
      // Se for 0, significa ilimitado
      displayValue = value > 0 ? `${value} ${value === 1 ? "foto" : "fotos"}` : "Ilimitado"
    }

    return (
      <div key={key} className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">{formattedKey}:</span>
        <span className={value === 0 && (key === "maxPhoto" || key === "maxPhotos") ? "italic font-medium" : ""}>
          {displayValue}
        </span>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        {/* Coluna do Carrossel */}
        <div className="w-full">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
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
                    {/* Card de Quantidade de Fotos */}
                    {((institutionProduct.details.minPhoto !== undefined && institutionProduct.details.minPhoto !== null) ||
                      (institutionProduct.details.maxPhoto !== undefined && institutionProduct.details.maxPhoto !== null)) && (
                        <div className="rounded-lg border bg-card p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <p className="font-semibold text-sm text-primary">
                              Quantidade de Fotos
                            </p>
                          </div>

                          <div className="space-y-2">
                            {/* Mínimo e Máximo em uma linha */}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {institutionProduct.details.minPhoto !== undefined &&
                                  institutionProduct.details.minPhoto !== null &&
                                  institutionProduct.details.minPhoto > 0 && (
                                    <>
                                      Mín: <span className="font-medium text-foreground">
                                        {institutionProduct.details.minPhoto} {institutionProduct.details.minPhoto === 1 ? "foto" : "fotos"}
                                      </span>
                                    </>
                                  )}
                                {institutionProduct.details.minPhoto !== undefined &&
                                  institutionProduct.details.minPhoto !== null &&
                                  institutionProduct.details.minPhoto > 0 &&
                                  institutionProduct.details.maxPhoto !== undefined &&
                                  institutionProduct.details.maxPhoto !== null && (
                                    <span className="mx-1">•</span>
                                  )}
                                {/* Máximo - mostra "Ilimitado" se for 0, null ou undefined */}
                                {institutionProduct.details.maxPhoto !== undefined &&
                                  institutionProduct.details.maxPhoto !== null &&
                                  institutionProduct.details.maxPhoto > 0 ? (
                                  <>
                                    Máx: <span className="font-medium text-foreground">
                                      {institutionProduct.details.maxPhoto} {institutionProduct.details.maxPhoto === 1 ? "foto" : "fotos"}
                                    </span>
                                  </>
                                ) : (institutionProduct.details.maxPhoto !== undefined &&
                                  institutionProduct.details.maxPhoto !== null &&
                                  institutionProduct.details.maxPhoto === 0) ||
                                  (!institutionProduct.details.maxPhoto &&
                                    institutionProduct.details.minPhoto !== undefined &&
                                    institutionProduct.details.minPhoto !== null &&
                                    institutionProduct.details.minPhoto > 0) ? (
                                  <>
                                    Máx: <span className="font-medium text-foreground italic">Ilimitado</span>
                                  </>
                                ) : null}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Card de Custos */}
                    {((institutionProduct.details.valorEncadernacao !== undefined && institutionProduct.details.valorEncadernacao !== null) ||
                      (institutionProduct.details.valorFoto !== undefined && institutionProduct.details.valorFoto !== null)) && (
                        <div className="rounded-lg border bg-card p-3 mt-3">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <p className="font-semibold text-sm text-primary">
                              Custos
                            </p>
                          </div>

                          <div className="space-y-2">
                            {/* Valor da Encadernação */}
                            {institutionProduct.details.valorEncadernacao !== undefined &&
                              institutionProduct.details.valorEncadernacao !== null && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Encadernação:</span>
                                  <span className="font-semibold text-foreground">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(institutionProduct.details.valorEncadernacao)}
                                  </span>
                                </div>
                              )}

                            {/* Valor por Foto */}
                            {institutionProduct.details.valorFoto !== undefined &&
                              institutionProduct.details.valorFoto !== null && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Por foto:</span>
                                  <span className="font-semibold text-foreground">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(institutionProduct.details.valorFoto)}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                  </>
                )}
                {(product.flag === "GENERIC" ||
                  product.flag === "DIGITAL_FILES") &&
                  institutionProduct.details.events &&
                  institutionProduct.details.events.length > 0 && (
                    <>
                      {/* Texto explicativo quando há múltiplos eventos */}
                      {institutionProduct.details.events.length > 1 && (
                        <p className="text-sm text-muted-foreground mb-3 italic">
                          Este produto está disponível para {institutionProduct.details.events.length} eventos.
                          Veja abaixo os preços e condições de cada um:
                        </p>
                      )}

                      {/* Mostrar informações sobre pacote completo (apenas para DIGITAL_FILES) */}
                      {product.flag === "DIGITAL_FILES" &&
                        institutionProduct.details.isAvailableUnit === false &&
                        institutionProduct.details.valorPackTotal !== undefined &&
                        institutionProduct.details.valorPackTotal !== null && (
                          <div className="mb-4 rounded-lg bg-primary/10 p-4 border-2 border-primary/30 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-primary" />
                              <p className="text-base font-bold text-primary">
                                Pacote Completo
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-primary mb-1">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(institutionProduct.details.valorPackTotal)}
                            </p>
                            <p className="text-xs text-primary/80 flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              Todos os eventos inclusos
                            </p>
                          </div>
                        )}

                      {/* Iterar sobre TODOS os eventos e mostrar seus detalhes */}
                      {institutionProduct.details.events.map((event, index) => (
                        <div
                          key={event.id || index}
                          className={`${index > 0 ? "mt-3" : ""} rounded-lg border bg-card p-3`}
                        >
                          {/* Nome do evento com badge */}
                          {event.name && (
                            <div className="flex items-center gap-2 mb-3">
                              <Package className="h-4 w-4 text-primary" />
                              <p className="font-semibold text-sm text-primary">
                                {event.name}
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            {/* Mínimo e Máximo de fotos em uma linha */}
                            {(event.minPhotos !== undefined && event.minPhotos !== null) ||
                              (event.maxPhotos !== undefined && event.maxPhotos !== null) ? (
                              <div className="flex items-center gap-2 text-sm">
                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {event.minPhotos !== undefined && event.minPhotos !== null && event.minPhotos > 0 && (
                                    <>
                                      Mín: <span className="font-medium text-foreground">{event.minPhotos} {event.minPhotos === 1 ? "foto" : "fotos"}</span>
                                    </>
                                  )}
                                  {event.minPhotos !== undefined && event.minPhotos !== null && event.minPhotos > 0 &&
                                    (event.maxPhotos !== undefined && event.maxPhotos !== null) && (
                                      <span className="mx-1">•</span>
                                    )}
                                  {/* Máximo de fotos - mostra "Ilimitado" se for 0, null ou undefined */}
                                  {event.maxPhotos !== undefined && event.maxPhotos !== null && event.maxPhotos > 0 ? (
                                    <>
                                      Máx: <span className="font-medium text-foreground">{event.maxPhotos} {event.maxPhotos === 1 ? "foto" : "fotos"}</span>
                                    </>
                                  ) : (event.maxPhotos !== undefined && event.maxPhotos !== null && event.maxPhotos === 0) ||
                                    (!event.maxPhotos && event.minPhotos !== undefined && event.minPhotos !== null && event.minPhotos > 0) ? (
                                    <>
                                      Máx: <span className="font-medium text-foreground italic">Ilimitado</span>
                                    </>
                                  ) : null}
                                </span>
                              </div>
                            ) : null}

                            {/* Valor por foto */}
                            {event.valorPhoto !== undefined && event.valorPhoto !== null && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Valor por foto:
                                  <span className="ml-1 font-semibold text-foreground">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(event.valorPhoto)}
                                  </span>
                                </span>
                              </div>
                            )}

                            {/* Valor do pacote do evento (apenas para DIGITAL_FILES) */}
                            {product.flag === "DIGITAL_FILES" &&
                              event.valorPack !== undefined &&
                              event.valorPack !== null &&
                              event.valorPack > 0 && (
                                <div className="flex items-center justify-between bg-primary/10 text-primary px-3 py-2 rounded-md mt-2 border border-primary/20">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                      Pacote do Evento
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(event.valorPack)}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
              </div>
              <Separator className="my-6" />
            </>
          )}

          <p className="mt-4 flex-1 text-muted-foreground">
            {product.description || "Sem descrição detalhada."}
          </p>

          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={handleAcquireProduct}
          >
            Adquirir Produto
          </Button>
        </div>
      </div>
    </div>
  )
}