"use client";


import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogTitle, DialogPrimitive } from "@/components/ui/dialog";
import { useState } from "react";

interface ImagePreviewCardProps {
  src: string;
  alt: string;
  onRemove?: () => void; 
  className?: string;
  progress?: number; 
  isDeleting?: boolean;
}

export function ImagePreviewCard({ src, alt, onRemove, className, progress, isDeleting }: ImagePreviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "relative group w-24 h-24 rounded-md overflow-hidden border border-muted-foreground/20 cursor-pointer",
            className
          )}
        >
          <img src={src} alt={alt} className={cn("w-full h-full object-cover", isDeleting && "opacity-50")} />
          {typeof progress === 'number' && progress < 100 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Progress value={progress} className="w-3/4 h-2" />
            </div>
          )}
          {isDeleting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          {onRemove && !isDeleting && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation(); // Prevent dialog from opening when clicking remove button
                onRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
  );
}
