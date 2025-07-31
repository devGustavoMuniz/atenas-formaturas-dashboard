"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProductSelectionStore } from "@/lib/store/product-selection-store"

import { type EventGroup } from "@/lib/api/photos-api"
import { formatCurrency } from "@/lib/utils"

interface SelectionSummaryProps {
  selectedPhotosCount: number
  eventGroups: EventGroup[]
}

export function SelectionSummary({ selectedPhotosCount, eventGroups }: SelectionSummaryProps) {
  const { product, institutionProduct } = useProductSelectionStore((state) => state)

  console.log({institutionProduct})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da Seleção</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Fotos selecionadas: {selectedPhotosCount}</p>
        {product?.flag === "GENERIC" && institutionProduct?.details?.events && (
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-semibold">Regras por Evento:</h3>
            {institutionProduct.details.events.map((eventDetail) => {
              const photosForEvent = eventGroups
                .find((group) => group.eventId === eventDetail.id)
                ?.photos.filter((photo) => useProductSelectionStore.getState().selectedPhotos[photo.id])

              const selectedCount = photosForEvent ? photosForEvent.length : 0

              // Only display if at least one photo is selected for this event
              if (selectedCount === 0) {
                return null
              }

              const isEventValid = selectedCount >= eventDetail.minPhotos

              return (
                <div key={eventDetail.id} className="rounded-md border p-3">
                  <p className="font-medium">{eventDetail.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Mínimo de fotos: {eventDetail.minPhotos} (Selecionadas: {selectedCount})
                    {!isEventValid && (
                      <span className="ml-2 text-red-500">
                        ({eventDetail.minPhotos - selectedCount} restantes)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor por foto extra: {formatCurrency(eventDetail.valorPhoto)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
