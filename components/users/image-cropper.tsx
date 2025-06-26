"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"

// Importação da biblioteca de recorte e seu CSS
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperProps {
  onImageCropped: (croppedImageUrl: string | null, file: File | null) => void
  onCroppingChange?: (isCropping: boolean) => void
}

export function ImageCropper({ onImageCropped, onCroppingChange }: ImageCropperProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)

  const updateCroppingState = useCallback(
    (isCropping: boolean) => {
      onCroppingChange?.(isCropping)
    },
    [onCroppingChange],
  )

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setOriginalFile(file)
      
      const reader = new FileReader()
      reader.addEventListener("load", () => {
        setSrc(reader.result?.toString() || "")
        updateCroppingState(true) // Inicia o modo de recorte
      })
      reader.readAsDataURL(file)
    }
  }

  const generateCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !originalFile) return;

    const canvas = document.createElement("canvas");
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;

      const croppedFile = new File([blob], originalFile.name, { type: originalFile.type });
      const croppedImageUrl = URL.createObjectURL(blob);
      onImageCropped(croppedImageUrl, croppedFile);
      
      // Limpa a interface de recorte
      setSrc(null)
      updateCroppingState(false)
    }, originalFile.type);
  }, [completedCrop, originalFile, onImageCropped, updateCroppingState]);

  const cancelCrop = () => {
    setSrc(null)
    setOriginalFile(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    updateCroppingState(false)
  };
  
  // Se não houver imagem selecionada, mostra apenas o botão de upload.
  if (!src) {
    return (
       <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto">
          <Label htmlFor="picture-upload" className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Upload className="mr-2 h-4 w-4" />
            Selecionar Imagem
          </Label>
          <input id="picture-upload" type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
       </div>
    )
  }

  // Se uma imagem foi selecionada, mostra a interface de recorte.
  return (
    <div className="space-y-4 w-full max-w-md mx-auto text-center">
       <div className="border rounded-md p-2 overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={c => setCrop(c)}
          onComplete={c => setCompletedCrop(c)}
          aspect={1}
          circularCrop
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={src}
            style={{ maxHeight: '400px' }}
          />
        </ReactCrop>
      </div>
      <div className="flex justify-center gap-4">
        <Button onClick={generateCrop} type="button" className="bg-yellow-500 text-black hover:bg-yellow-400">
          Aplicar Corte
        </Button>
        <Button onClick={cancelCrop} type="button" variant="outline">
          Cancelar
        </Button>
      </div>
    </div>
  )
}