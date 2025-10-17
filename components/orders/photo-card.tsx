"use client"

import { useState } from "react"
import { ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogTitle, DialogPrimitive } from "@/components/ui/dialog"

interface PhotoCardProps {
  src: string
  name: string
  alt: string
  className?: string
}

export function PhotoCard({ src, name, alt, className }: PhotoCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "relative group flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors",
            className
          )}
        >
          <div className="relative w-20 h-20 rounded-md overflow-hidden border border-muted-foreground/20">
            <img src={src} alt={alt} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="text-white h-6 w-6" />
            </div>
          </div>
          <span className="text-xs text-center text-muted-foreground truncate w-full" title={name}>
            {name}
          </span>
        </div>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="flex items-center justify-center">
          <DialogPrimitive.Content className="relative">
            <DialogTitle className="sr-only">{alt}</DialogTitle>
            <img src={src} alt={alt} className="object-contain w-auto h-auto max-w-[90vw] max-h-[90vh]" />
          </DialogPrimitive.Content>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  )
}
