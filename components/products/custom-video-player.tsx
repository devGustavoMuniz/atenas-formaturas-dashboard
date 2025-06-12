// components/products/custom-video-player.tsx

"use client"

import { useState, useRef, type ElementRef } from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomVideoPlayerProps {
    src: string
    className?: string
}

export function CustomVideoPlayer({ src, className }: CustomVideoPlayerProps) {
    // Referência para o elemento <video> no DOM
    const videoRef = useRef<ElementRef<"video">>(null)

    // Estado para controlar se o vídeo está tocando ou pausado
    const [isPlaying, setIsPlaying] = useState(false)

    // Estado para mostrar o controle ao passar o mouse
    const [isHovered, setIsHovered] = useState(false)

    // Função para alternar entre play e pause
    const togglePlayPause = () => {
        const video = videoRef.current
        if (!video) return

        if (video.paused) {
            video.play()
        } else {
            video.pause()
        }
    }

    return (
        <div
            className={cn("relative w-full overflow-hidden rounded-md group", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <video
                ref={videoRef}
                src={src}
                loop
                muted // Iniciar mutado é uma boa prática para autoplay
                playsInline
                className="h-full w-full object-cover"
                // Atualiza nosso estado interno quando o vídeo de fato começa ou para
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                // Permite clicar no próprio vídeo para tocar/pausar
                onClick={togglePlayPause}
            >
                Seu navegador não suporta a tag de vídeo.
            </video>

            {/* Botão de controle customizado */}
            <div
                className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity",
                    // Mostra o botão se o vídeo estiver pausado ou se o mouse estiver sobre ele
                    isPlaying && !isHovered ? "opacity-0" : "opacity-100"
                )}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-16 w-16 rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 hover:text-white"
                    onClick={togglePlayPause}
                >
                    {isPlaying ? (
                        <Pause className="h-8 w-8" />
                    ) : (
                        <Play className="h-8 w-8 ml-1" />
                    )}
                </Button>
            </div>
        </div>
    )
}