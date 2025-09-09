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
  selectionEnabled?: boolean // Nova propriedade
  disabled?: boolean // Nova propriedade para desabilitar seleção
}

export function SelectableImageCard({
  photoId,
  src,
  alt,
  isSelected,
  onSelectionChange,
  className,
  selectionEnabled = true, // Valor padrão é true
  disabled = false, // Valor padrão é false
}: SelectableImageCardProps) {
  const handleCardClick = () => {
    // Sempre permite o clique na imagem para visualização
    // A seleção só é bloqueada se disabled=true E a foto não estiver selecionada
    if (selectionEnabled && !(disabled && !isSelected)) {
      onSelectionChange(photoId, !isSelected)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Impede que o clique no card seja acionado
    if (selectionEnabled && !(disabled && !isSelected)) {
      onSelectionChange(photoId, !isSelected)
    }
  }

  return (
    <div
      className={cn(
        "relative h-24 w-24",
        selectionEnabled && "cursor-pointer", // Aplica o cursor apenas se a seleção estiver ativa
        className
      )}
      onClick={handleCardClick}
    >
      <ImagePreviewCard src={src} alt={alt} className="h-full w-full" />
      {selectionEnabled && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-md border-4 transition-all",
              isSelected ? "border-primary" : "border-transparent"
            )}
          />
          <Checkbox
            checked={isSelected}
            onClick={handleCheckboxClick}
            disabled={disabled && !isSelected}
            className={cn(
              "absolute right-2 top-2 z-10 h-6 w-6 bg-background/80 hover:bg-background/90",
              disabled && !isSelected && "opacity-50 cursor-not-allowed"
            )}
          />
        </>
      )}
    </div>
  )
}

