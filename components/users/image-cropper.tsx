"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperProps {
  onImageCropped: (croppedImageUrl: string | null, file: File | null) => void
  onCroppingChange?: (isCropping: boolean) => void
}

export function ImageCropper({ onImageCropped, onCroppingChange }: ImageCropperProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const [hasCropChanged, setHasCropChanged] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)

  // Notificar o componente pai quando o estado de corte muda
  const updateCroppingState = useCallback(
    (isCropping: boolean) => {
      if (onCroppingChange) {
        onCroppingChange(isCropping)
      }
    },
    [onCroppingChange],
  )

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setOriginalFile(file)

      const reader = new FileReader()
      reader.addEventListener("load", () => {
        setSrc(reader.result as string)
        // Reset crop when new image is loaded
        setCrop({
          unit: "%",
          width: 100,
          height: 100,
          x: 0,
          y: 0,
        })
        setHasCropChanged(false) // Reset crop change state
        updateCroppingState(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const generateCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current || !originalFile) return

    const canvas = document.createElement("canvas")
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return
    }

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    // Set canvas size to desired output size
    canvas.width = cropWidth
    canvas.height = cropHeight

    // Draw the cropped image onto the canvas
    ctx.drawImage(imgRef.current, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty")
        return
      }

      // Create a new File from the blob
      const croppedFile = new File([blob], originalFile.name, {
        type: originalFile.type,
        lastModified: new Date().getTime(),
      })

      const croppedImageUrl = URL.createObjectURL(blob)

      // Apenas atualiza o estado local com a imagem cortada
      onImageCropped(croppedImageUrl, croppedFile)
      setSrc(null) // Close the cropping interface
      setHasCropChanged(false) // Reset crop change state
      updateCroppingState(false)
    }, originalFile.type)
  }, [completedCrop, onImageCropped, originalFile, updateCroppingState])

  const handleCropComplete = (crop: Crop) => {
    setCompletedCrop(crop)
  }

  const handleCropChange = (crop: Crop) => {
    setCrop(crop)
    setHasCropChanged(true) // Mark that crop has been changed
  }

  const cancelCrop = () => {
    setSrc(null)
    setHasCropChanged(false)
    updateCroppingState(false)
  }

  // Check if crop button should be enabled
  const isCropButtonEnabled = hasCropChanged && completedCrop

  return (
    <div className="space-y-4 w-full max-w-md mx-auto text-center">
      <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto">
        <Label htmlFor="picture" className="text-center mb-2">
          Selecione uma imagem para o perfil
        </Label>
        <div className="flex items-center justify-center gap-2">
          <Label
            htmlFor="picture"
            className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Upload className="mr-2 h-4 w-4" />
            Escolher arquivo
          </Label>
          <input id="picture" type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
          {src && (
            <div className="flex gap-2">
              <Button
                onClick={generateCrop}
                type="button"
                disabled={!isCropButtonEnabled}
                className={`${
                  isCropButtonEnabled
                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Aplicar Corte
              </Button>
              <Button onClick={cancelCrop} type="button" variant="outline">
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {src && (
        <div className="mt-4 border rounded-md p-2 overflow-hidden max-w-md mx-auto">
          <ReactCrop crop={crop} onChange={handleCropChange} onComplete={handleCropComplete} aspect={1} circularCrop>
            <img
              ref={imgRef}
              src={src || "/placeholder.svg"}
              alt="Imagem para corte"
              className="max-w-full h-auto"
              crossOrigin="anonymous"
            />
          </ReactCrop>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {!hasCropChanged ? "Arraste para ajustar o corte da imagem" : "Clique em 'Aplicar Corte' para confirmar"}
          </p>
        </div>
      )}
    </div>
  )
}
