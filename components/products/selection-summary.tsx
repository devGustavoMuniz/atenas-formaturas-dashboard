"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProductSelectionStore } from "@/lib/store/product-selection-store"
import { type EventGroup } from "@/lib/api/photos-api"
import { formatCurrency } from "@/lib/utils"
import { AlbumDetails, DigitalFilesDetails } from "@/lib/product-details-types"

interface SelectionSummaryProps {
  selectedPhotosCount: number
  eventGroups: EventGroup[]
}

export function SelectionSummary({ selectedPhotosCount, eventGroups }: SelectionSummaryProps) {
  const {
    product,
    institutionProduct,
    selectedEvents,
    isPackageComplete,
    selectedPhotos,
  } = useProductSelectionStore((state) => state)

  const isDigitalFilesPackage =
    product?.flag === "DIGITAL_FILES" &&
    (institutionProduct?.details as DigitalFilesDetails)?.isAvailableUnit === false

  const digitalFilesTotal = useMemo(() => {
    if (!isDigitalFilesPackage) return 0

    const details = institutionProduct?.details as DigitalFilesDetails

    if (isPackageComplete) {
      return details?.valorPackTotal ?? 0
    }

    return (
      details?.events?.reduce((total, event) => {
        if (selectedEvents[event.id]) {
          return total + (event.valorPack ?? 0)
        }
        return total
      }, 0) ?? 0
    )
  }, [isDigitalFilesPackage, isPackageComplete, selectedEvents, institutionProduct])

  const albumTotal = useMemo(() => {
    if (product?.flag !== "ALBUM") return 0

    const details = institutionProduct?.details as AlbumDetails
    const valorEncadernacao = details?.valorEncadernacao ?? 0
    const valorFoto = details?.valorFoto ?? 0

    return valorEncadernacao + selectedPhotosCount * valorFoto
  }, [product, institutionProduct, selectedPhotosCount])

  const renderGenericSummary = () => {
    if (!institutionProduct?.details?.events) return null

    const eventSummaries = institutionProduct.details.events
      .map((eventDetail) => {
        const photosForEvent = eventGroups
          .find((group) => group.eventId === eventDetail.id)
          ?.photos.filter((photo) => selectedPhotos[photo.id])

        const selectedCount = photosForEvent?.length ?? 0

        if (selectedCount === 0) {
          return null
        }

        const isEventValid = selectedCount >= (eventDetail.minPhotos ?? 0) &&
                             (eventDetail.maxPhotos ? selectedCount <= eventDetail.maxPhotos : true)
        const isBelowMin = selectedCount < (eventDetail.minPhotos ?? 0)
        const isAboveMax = eventDetail.maxPhotos && selectedCount > eventDetail.maxPhotos

        return (
          <div key={eventDetail.id} className="rounded-md border p-3">
            <p className="font-medium">{eventDetail.name}</p>
            <p className="text-sm text-muted-foreground">
              Mínimo: {eventDetail.minPhotos ?? 0} / Máximo: {eventDetail.maxPhotos ?? '∞'}
            </p>
            <p className="text-sm text-muted-foreground">
              Selecionadas: {selectedCount}
              {isBelowMin && (
                <span className="ml-2 text-red-500">
                  ({(eventDetail.minPhotos ?? 0) - selectedCount} restantes)
                </span>
              )}
              {isAboveMax && (
                <span className="ml-2 text-red-500">
                  ({selectedCount - (eventDetail.maxPhotos ?? 0)} a mais)
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Valor por foto extra: {formatCurrency(eventDetail.valorPhoto)}
            </p>
          </div>
        )
      })
      .filter(Boolean) // Remove as entradas nulas

    if (eventSummaries.length === 0) {
      return null
    }

    return (
      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold">Regras por Evento:</h3>
        {eventSummaries}
      </div>
    )
  }

  const renderAlbumSummary = () => {
    const details = institutionProduct?.details as AlbumDetails
    const min = details?.minPhoto ?? 0
    const max = details?.maxPhoto ?? "∞"
    const isValid = selectedPhotosCount >= min

    return (
      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold">Regras do Álbum:</h3>
        <div className="rounded-md border p-3">
          <p className="font-medium">Quantidade de Fotos</p>
          <p className="text-sm text-muted-foreground">
            Mínimo: {min} / Máximo: {max}
          </p>
          <p className="text-sm text-muted-foreground">
            Selecionadas: {selectedPhotosCount}
            {!isValid && (
              <span className="ml-2 text-red-500">({min - selectedPhotosCount} restantes)</span>
            )}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="font-medium">Custo</p>
          <p className="text-sm text-muted-foreground">
            Encadernação: {formatCurrency(details?.valorEncadernacao ?? 0)}
          </p>
          <p className="text-sm text-muted-foreground">
            Valor por Foto: {formatCurrency(details?.valorFoto ?? 0)}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xl font-bold">Total: {formatCurrency(albumTotal)}</p>
        </div>
      </div>
    )
  }

  const renderDigitalFilesSummary = () => {
    const details = institutionProduct?.details as DigitalFilesDetails

    return (
      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold">Resumo do Pacote:</h3>
        {isPackageComplete ? (
          <div className="rounded-md border p-3">
            <p className="font-medium">Pacote Completo</p>
            <p className="text-sm text-muted-foreground">Todos os eventos incluídos.</p>
          </div>
        ) : (
          details?.events?.map((event) =>
            selectedEvents[event.id] ? (
              <div key={event.id} className="rounded-md border p-3">
                <p className="font-medium">{event.name}</p>
                <p className="text-sm text-muted-foreground">Valor: {formatCurrency(event.valorPack ?? 0)}</p>
              </div>
            ) : null
          )
        )}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xl font-bold">Total: {formatCurrency(digitalFilesTotal)}</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da Seleção</CardTitle>
      </CardHeader>
      <CardContent>
        {product?.flag === "ALBUM" ? (
          renderAlbumSummary()
        ) : isDigitalFilesPackage ? (
          renderDigitalFilesSummary()
        ) : (
          <>
            <p>Fotos selecionadas: {selectedPhotosCount}</p>
            {(product?.flag === "GENERIC" || product?.flag === "DIGITAL_FILES") &&
              renderGenericSummary()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
