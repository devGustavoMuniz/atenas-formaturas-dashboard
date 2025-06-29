"use client";

import { UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  className?: string;
}

export function Dropzone({ onDrop, className }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.svg'],
    },
  });

  return (
    <div
      {...getRootProps({
        className: cn(
          "flex flex-col items-center justify-center w-full h-32 px-4 py-6 text-center border-2 border-dashed rounded-lg cursor-pointer border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors",
          isDragActive && "border-primary bg-primary/10",
          className
        ),
      })}
    >
      <input {...getInputProps()} />
      <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
      {isDragActive ? (
        <p className="font-semibold text-primary">Solte as imagens aqui...</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Arraste e solte as imagens aqui, ou clique para selecionar
        </p>
      )}
    </div>
  );
}
