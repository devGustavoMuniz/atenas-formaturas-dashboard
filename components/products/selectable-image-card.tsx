"use client"

import { ImagePreviewCard } from "@/components/users/image-preview-card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface SelectableImageCardProps {
  photoId: string
  src: string
  alt: string
  isSelected: boolean
  onSelectionChange: (photoId: string, isSelected: boolean) => void
  className?: string
}

export function SelectableImageCard({
  photoId,
  src,
  alt,
  isSelected,
  onSelectionChange,
  className,
}: SelectableImageCardProps) {
  const handleCardClick = () => {
    onSelectionChange(photoId, !isSelected)
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click from firing
    onSelectionChange(photoId, !isSelected)
  }

  return (
    <div
      className={cn("relative h-24 w-24 cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <ImagePreviewCard src={src} alt={alt} className="h-full w-full" />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-md border-4 transition-all",
          isSelected ? "border-primary" : "border-transparent"
        )}
      />
      <Checkbox
        checked={isSelected}
        onClick={handleCheckboxClick}
        className="absolute right-2 top-2 z-10 h-6 w-6 bg-background/80 hover:bg-background/90"
      />
    </div>
  )
}

