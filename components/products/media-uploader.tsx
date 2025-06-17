// components/products/media-uploader.tsx

"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, X, FileVideo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomVideoPlayer } from "./custom-video-player"

export interface FilePreview {
    file: File
    preview: string
}

interface MediaUploaderProps {
    // Recebe e devolve a lista de arquivos novos
    onNewFilesChange: (photos: FilePreview[], videos: FilePreview[]) => void
    // Recebe e devolve a lista de URLs existentes (para remoção)
    onExistingMediaChange: (photos: string[], videos: string[]) => void
    existingPhotos: string[]
    existingVideos: string[]
}

export function MediaUploader({ onNewFilesChange, onExistingMediaChange, existingPhotos, existingVideos }: MediaUploaderProps) {
    const [photoFiles, setPhotoFiles] = useState<FilePreview[]>([])
    const [videoFiles, setVideoFiles] = useState<FilePreview[]>([])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newPhotos = acceptedFiles.filter(f => f.type.startsWith("image/"))
        const newVideos = acceptedFiles.filter(f => f.type.startsWith("video/"))

        if (existingVideos.length + videoFiles.length + newVideos.length > 3) {
            alert("Você pode enviar no máximo 3 vídeos.");
            return;
        }

        const newPhotoPreviews = [
            ...photoFiles,
            ...newPhotos.map(file => ({ file, preview: URL.createObjectURL(file) }))
        ]
        const newVideoPreviews = [
            ...videoFiles,
            ...newVideos.map(file => ({ file, preview: URL.createObjectURL(file) }))
        ]

        setPhotoFiles(newPhotoPreviews);
        setVideoFiles(newVideoPreviews);
        onNewFilesChange(newPhotoPreviews, newVideoPreviews);

    }, [existingVideos.length, videoFiles, photoFiles, onNewFilesChange])

    const removeNewFile = (fileToRemove: FilePreview, type: 'photo' | 'video') => {
        let newPhotoPreviews = photoFiles;
        let newVideoPreviews = videoFiles;
        if (type === 'photo') {
            newPhotoPreviews = photoFiles.filter(p => p !== fileToRemove);
            setPhotoFiles(newPhotoPreviews);
        } else {
            newVideoPreviews = videoFiles.filter(v => v !== fileToRemove);
            setVideoFiles(newVideoPreviews);
        }
        onNewFilesChange(newPhotoPreviews, newVideoPreviews);
    };

    const removeExistingMedia = (url: string, type: 'photo' | 'video') => {
        if (type === 'photo') {
            onExistingMediaChange(existingPhotos.filter(p => p !== url), existingVideos);
        } else {
            onExistingMediaChange(existingPhotos, existingVideos.filter(v => v !== url));
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'video/*': [] } });

    return (
        <div className="space-y-4">
            <div {...getRootProps()} className={`w-full p-6 border-2 border-dashed rounded-md cursor-pointer text-center ${isDragActive ? "border-primary bg-accent" : "border-input"}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-10 w-10" />
                    <p>Arraste e solte arquivos aqui, ou clique para selecionar</p>
                    <p className="text-xs">(Imagens sem limite, Vídeos no máximo 3)</p>
                </div>
            </div>

            {/* Previews de fotos novas */}
            {photoFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photoFiles.map((p, i) => (
                        <div key={i} className="relative group aspect-square">
                            <img src={p.preview} className="w-full h-full object-cover rounded-md" alt={`Preview ${i}`} />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeNewFile(p, 'photo')}><X className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Listagem de vídeos novos */}
            {videoFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium">Vídeos a serem enviados:</h4>
                    {videoFiles.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 border rounded-md">
                            <FileVideo className="h-6 w-6 shrink-0"/>
                            <p className="text-sm truncate flex-1">{v.file.name}</p>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeNewFile(v, 'video')}><X className="h-4 w-4"/></Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mídias existentes */}
            {(existingPhotos.length > 0 || existingVideos.length > 0) && <h3 className="text-lg font-medium pt-4 border-t">Mídias Atuais</h3>}
            {existingPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {existingPhotos.map((photo, i) => (
                        <div key={i} className="relative group aspect-square">
                            <img src={photo} className="w-full h-full object-cover rounded-md" alt={`Foto ${i}`} />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeExistingMedia(photo, 'photo')}><X className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {existingVideos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {existingVideos.map((video, i) => (
                        <div key={i} className="relative group">
                            <CustomVideoPlayer src={video} />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeExistingMedia(video, 'video')}><X className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}