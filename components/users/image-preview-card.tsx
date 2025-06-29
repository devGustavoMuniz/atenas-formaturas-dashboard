"use client";

import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImagePreviewCardProps {
  src: string;
  alt: string;
  onRemove?: () => void; 
  className?: string;
  progress?: number; 
  isDeleting?: boolean;
}

export function ImagePreviewCard({ src, alt, onRemove, className, progress, isDeleting }: ImagePreviewCardProps) {
  return (
    <div
      className={cn(
        "relative group w-24 h-24 rounded-md overflow-hidden border border-muted-foreground/20",
        className
      )}
    >
      <Image src={src} alt={alt} layout="fill" objectFit="cover" className={cn(isDeleting && "opacity-50")} />
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
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
