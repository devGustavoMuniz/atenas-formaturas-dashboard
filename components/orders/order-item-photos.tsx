"use client"

import { OrderItemDto } from "@/lib/order-types"
import { PhotoCard } from "@/components/orders/photo-card"

interface OrderItemPhotosProps {
  item: OrderItemDto
  isExpanded: boolean
}

export function OrderItemPhotos({ item, isExpanded }: OrderItemPhotosProps) {
  const photos = item.details.filter(detail => detail.photoUrl)

  if (!isExpanded || photos.length === 0) return null

  return (
    <div className="px-4 py-6 bg-muted/20">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {photos.map((detail, index) => (
          <PhotoCard
            key={detail.id}
            src={detail.photoUrl!}
            name={detail.photoName || `Foto ${index + 1}`}
            alt={`Foto ${index + 1} - ${item.productName}`}
          />
        ))}
      </div>
    </div>
  )
}