"use client"

import { OrderItemDto } from "@/lib/order-types"
import { ImagePreviewCard } from "@/components/users/image-preview-card"

interface OrderItemPhotosProps {
  item: OrderItemDto
  isExpanded: boolean
}

export function OrderItemPhotos({ item, isExpanded }: OrderItemPhotosProps) {
  const photos = item.details.filter(detail => detail.photoUrl)
  
  if (!isExpanded || photos.length === 0) return null

  return (
    <div className="px-4 py-6 bg-muted/20">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-6">
        {photos.map((detail, index) => (
          <ImagePreviewCard
            key={detail.id}
            src={detail.photoUrl!}
            alt={`Foto ${index + 1} - ${item.productName}`}
            className="w-16 h-16"
          />
        ))}
      </div>
    </div>
  )
}