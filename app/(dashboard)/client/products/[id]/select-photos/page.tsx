"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useProductSelectionStore } from "@/lib/store/product-selection-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { fetchUserEventPhotos, type EventGroup } from "@/lib/api/photos-api"
import { SelectableImageCard } from "@/components/products/selectable-image-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function SelectPhotosPage() {
  const { product, institutionProduct } = useProductSelectionStore((state) => state)
  const user = useAuthStore((state) => state.user)
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Record<string, boolean>>({})
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (product && institutionProduct) {
      console.log("Detalhes do produto recebidos:", { product, institutionProduct })
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
        setEventGroups(data.eventGroups)
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
    setSelectedPhotos((prev) => ({
      ...prev,
      [photoId]: isSelected,
    }))
  }

  const toggleCollapsible = (eventId: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }))
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
        <p className="text-muted-foreground">Selecione as fotos que deseja incluir no seu produto.</p>
      </div>

      <div className="space-y-4">
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
                        src={photo.signedUrl}
                        alt={`Foto do evento ${group.eventName}`}
                        isSelected={!!selectedPhotos[photo.id]}
                        onSelectionChange={(isSelected) => handlePhotoSelection(photo.id, isSelected)}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg">Próximo</Button>
      </div>
    </div>
  )
}
