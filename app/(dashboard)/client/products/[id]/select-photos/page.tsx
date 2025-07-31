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

export default function SelectPhotosPage() {
  const { product, institutionProduct, selectedPhotos, setSelectedPhoto } = useProductSelectionStore((state) => state)
  const user = useAuthStore((state) => state.user)
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (product && institutionProduct) {
      console.log("Detalhes do produto recebidos:", { institutionProduct })
    }

    if (!user?.id) {
      setError("Usuário não encontrado.")
      setIsLoading(false)
      return
    }

    const loadPhotos = async () => {
      setIsLoading(true)
      try {
        const data = await fetchUserEventPhotos(user.id)

        if (product?.flag === "GENERIC" && institutionProduct?.details?.events) {
          const allowedEventIds = new Set(institutionProduct.details.events.map((e) => e.id))
          const filteredEventGroups = data.eventGroups.filter((group) => allowedEventIds.has(group.eventId))
          setEventGroups(filteredEventGroups)
        } else {
          setEventGroups(data.eventGroups)
        }

        // Initialize all collapsible components to be open by default
        const initialOpenStates = data.eventGroups.reduce(
          (acc, group) => {
            acc[group.eventId] = true
            return acc
          },
          {} as Record<string, boolean>
        )
        setOpenStates(initialOpenStates)
      } catch (err) {
        console.error("Falha ao carregar as fotos do usuário:", err)
        setError("Falha ao carregar as fotos do usuário.")
      } finally {
        setIsLoading(false)
      }
    }

    loadPhotos()
  }, [product, institutionProduct, user])

  const handlePhotoSelection = (photoId: string, isSelected: boolean) => {
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
    if (product?.flag === "GENERIC" && institutionProduct?.details?.events) {
      const allEventsValid = institutionProduct.details.events.every((eventDetail) => {
        const photosForEvent = eventGroups
          .find((group) => group.eventId === eventDetail.id)
          ?.photos.filter((photo) => selectedPhotos[photo.id])

        // If no photos are selected for this event, the rule doesn't apply
        if (!photosForEvent || photosForEvent.length === 0) {
          return true
        }

        // If photos are selected, then the minPhotos rule must be met
        return photosForEvent.length >= eventDetail.minPhotos
      })
      return allEventsValid
    }
    // Default to true if no specific rules or product flag is not GENERIC
    return true
  }, [product, institutionProduct, selectedPhotos, eventGroups])

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
        <p className="text-muted-foreground">Selecione as fotos que deseja incluir no seu produto.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {eventGroups.map((group) => (
            <Collapsible
              key={group.eventId}
              open={openStates[group.eventId] || false}
              onOpenChange={() => toggleCollapsible(group.eventId)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <div className="flex w-full cursor-pointer items-center justify-between rounded-t-lg transition-colors hover:bg-muted/50">
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
        <Button size="lg" disabled={!isNextButtonEnabled}>Próximo</Button>
      </div>
    </div>
  )
}
