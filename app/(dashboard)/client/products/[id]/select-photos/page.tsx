"use client"

import { useEffect, useState, useMemo } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useProductSelectionStore } from "@/lib/store/product-selection-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { fetchUserEventPhotos, type EventGroup } from "@/lib/api/photos-api"
import { SelectableImageCard } from "@/components/products/selectable-image-card"
import { SelectionSummary } from "@/components/products/selection-summary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlbumDetails, DigitalFilesDetails } from "@/lib/product-details-types"
import { useCartStore } from "@/lib/store/cart-store"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import type { CartItem, CartItemSelection } from "@/lib/cart-types"

export default function SelectPhotosPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { addToCart } = useCartStore()
  const {
    product,
    institutionProduct,
    selectedPhotos,
    setSelectedPhoto,
    selectedEvents,
    isPackageComplete,
    setSelectedEvent,
    setPackageComplete,
    clearSelections,
  } = useProductSelectionStore((state) => state)
  const user = useAuthStore((state) => state.user)
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  const isDigitalFilesPackage =
    product?.flag === "DIGITAL_FILES" &&
    (institutionProduct?.details as DigitalFilesDetails)?.isAvailableUnit === false

  useEffect(() => {
    if (product && institutionProduct) {
      console.log("Detalhes do produto recebidos:", { institutionProduct })
    }

    if (!user?.id) {
      setError("Usuário não encontrado.")
      setIsLoading(false)
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await fetchUserEventPhotos(user.id)
        let filteredEventGroups = data.eventGroups

        const details = institutionProduct?.details

        if (details?.events) {
          const allowedEventIds = new Set(details.events.map((e) => e.id))
          filteredEventGroups = data.eventGroups.filter((group) => allowedEventIds.has(group.eventId))
        }

        setEventGroups(filteredEventGroups)

        const initialOpenStates = filteredEventGroups.reduce(
          (acc, group) => {
            acc[group.eventId] = true
            return acc
          },
          {} as Record<string, boolean>
        )
        setOpenStates(initialOpenStates)
      } catch (err) {
        console.error("Falha ao carregar dados:", err)
        setError("Falha ao carregar os dados necessários.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [product, institutionProduct, user])

  const handlePhotoSelection = (photoId: string, isSelected: boolean) => {
    if (product?.flag === "ALBUM" && isSelected) {
      const details = institutionProduct?.details as AlbumDetails
      const maxPhotos = details?.maxPhoto ?? Infinity
      const selectedCount = Object.values(selectedPhotos).filter(Boolean).length

      if (selectedCount >= maxPhotos) {
        // Opcional: Adicionar um toast/alerta para o usuário
        console.warn(`Você não pode selecionar mais de ${maxPhotos} fotos.`)
        return
      }
    }
    setSelectedPhoto(photoId, isSelected)
  }

  const toggleCollapsible = (eventId: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }))
  }

  const selectedPhotosCount = useMemo(() => {
    return Object.values(selectedPhotos).filter(Boolean).length
  }, [selectedPhotos])

  const isNextButtonEnabled = useMemo(() => {
    if (isDigitalFilesPackage) {
      const hasSelectedEvents = Object.values(selectedEvents).some((isSelected) => isSelected)
      return isPackageComplete || hasSelectedEvents
    }

    if (product?.flag === "ALBUM") {
      const details = institutionProduct?.details as AlbumDetails
      const min = details?.minPhoto ?? 0
      const max = details?.maxPhoto ?? Infinity
      const count = selectedPhotosCount
      return count >= min && count <= max
    }

    if (
      (product?.flag === "GENERIC" || (product?.flag === "DIGITAL_FILES" && !isDigitalFilesPackage)) &&
      institutionProduct?.details?.events
    ) {
      return institutionProduct.details.events.every((eventDetail) => {
        const photosForEvent = eventGroups
          .find((group) => group.eventId === eventDetail.id)
          ?.photos.filter((photo) => selectedPhotos[photo.id])

        if (!photosForEvent || photosForEvent.length === 0) {
          return true
        }
        return photosForEvent.length >= eventDetail.minPhotos
      })
    }
    return true
  }, [
    product,
    institutionProduct,
    selectedPhotos,
    eventGroups,
    isDigitalFilesPackage,
    isPackageComplete,
    selectedEvents,
    selectedPhotosCount,
  ])

  const handleAddToCart = () => {
    if (!product || !institutionProduct) return

    let selection: CartItemSelection | null = null
    let totalPrice = 0

    const flag = product.flag
    const details = institutionProduct.details

    if (flag === "ALBUM") {
      const albumDetails = details as AlbumDetails
      const photoIds = Object.keys(selectedPhotos).filter((k) => selectedPhotos[k])
      selection = { type: "ALBUM", selectedPhotos: photoIds }
      totalPrice =
        (albumDetails.valorEncadernacao ?? 0) + photoIds.length * (albumDetails.valorFoto ?? 0)
    } else if (isDigitalFilesPackage) {
      const digitalDetails = details as DigitalFilesDetails
      const eventIds = Object.keys(selectedEvents).filter((k) => selectedEvents[k])
      selection = {
        type: "DIGITAL_FILES_PACKAGE",
        selectedEvents: eventIds,
        isPackageComplete,
      }
      if (isPackageComplete) {
        totalPrice = digitalDetails.valorPackTotal ?? 0
      } else {
        totalPrice = digitalDetails.events?.reduce((total, event) => {
          if (selectedEvents[event.id]) {
            return total + (event.valorPack ?? 0)
          }
          return total
        }, 0) ?? 0
      }
    } else if (flag === "GENERIC" || (flag === "DIGITAL_FILES" && !isDigitalFilesPackage)) {
      const genericDetails = details as GenericDetails // Reutiliza a estrutura de GENERIC
      const photosByEvent: Record<string, string[]> = {}

      totalPrice = genericDetails.events.reduce((total, eventDetail) => {
        const eventPhotos = eventGroups
          .find((group) => group.eventId === eventDetail.id)
          ?.photos.filter((photo) => selectedPhotos[photo.id])

        const selectedCount = eventPhotos?.length ?? 0
        if (selectedCount > 0) {
          photosByEvent[eventDetail.id] = eventPhotos!.map((p) => p.id)
          return total + selectedCount * eventDetail.valorPhoto
        }
        return total
      }, 0)

      selection = {
        type: flag === "GENERIC" ? "GENERIC" : "DIGITAL_FILES_UNIT",
        selectedPhotos: photosByEvent,
      }
    }

    if (!selection) {
      console.error("Não foi possível determinar o tipo de seleção para o carrinho.")
      return
    }

    const cartItem: CartItem = {
      id: `${product.id}-${new Date().getTime()}`,
      product,
      institutionProduct,
      selection,
      totalPrice,
    }

    addToCart(cartItem)
    toast({ title: "Produto adicionado!", description: `${product.name} foi adicionado ao seu carrinho.` })
    clearSelections()
    router.push("/client/products")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-8 w-1/4" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-24 rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{product?.name}</h1>
        <p className="text-muted-foreground">
          {isDigitalFilesPackage
            ? "Selecione os pacotes de eventos que deseja adquirir."
            : "Selecione as fotos que deseja incluir no seu produto."}
        </p>
      </div>

      {isDigitalFilesPackage && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comprar Pacote Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="complete-package"
                checked={isPackageComplete}
                onCheckedChange={(checked) => setPackageComplete(Boolean(checked))}
              />
              <Label htmlFor="complete-package" className="font-bold">
                Adquirir todos os eventos em um único pacote.
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {eventGroups.map((group) => (
            <Collapsible
              key={group.eventId}
              open={openStates[group.eventId] || false}
              onOpenChange={() => toggleCollapsible(group.eventId)}
            >
              <Card>
                <div className="flex w-full items-center justify-between rounded-t-lg transition-colors hover:bg-muted/50">
                  <CollapsibleTrigger asChild>
                    <div className="flex flex-grow cursor-pointer items-center">
                      <CardHeader>
                        <CardTitle>{group.eventName}</CardTitle>
                      </CardHeader>
                      <div className="pr-4">
                        {openStates[group.eventId] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  {isDigitalFilesPackage && (
                    <div className="flex items-center space-x-2 pr-4">
                      <Checkbox
                        id={`event-${group.eventId}`}
                        checked={!!selectedEvents[group.eventId]}
                        onCheckedChange={(checked) =>
                          setSelectedEvent(group.eventId, Boolean(checked))
                        }
                        disabled={isPackageComplete}
                      />
                      <Label htmlFor={`event-${group.eventId}`}>Comprar este pacote</Label>
                    </div>
                  )}
                </div>
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {group.photos.map((photo) => (
                        <SelectableImageCard
                          key={photo.id}
                          photoId={photo.id}
                          src={photo.signedUrl}
                          alt={`Foto do evento ${group.eventName}`}
                          isSelected={!!selectedPhotos[photo.id]}
                          onSelectionChange={handlePhotoSelection}
                          selectionEnabled={!isDigitalFilesPackage}
                        />
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
        <div>
          <SelectionSummary selectedPhotosCount={selectedPhotosCount} eventGroups={eventGroups} />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" disabled={!isNextButtonEnabled} onClick={handleAddToCart}>
          Adicionar ao Carrinho
        </Button>
      </div>
    </div>
  )
}
