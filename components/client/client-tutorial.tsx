"use client"

import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/lib/auth/use-auth"
import { usePathname } from "next/navigation"

export function ClientTutorial() {
    const { user } = useAuth()
    const pathname = usePathname()

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            doneBtnText: "Concluir",
            steps: [
                {
                    element: "#sidebar-home",
                    popover: {
                        title: "Galeria de Fotos",
                        description: "Aqui você encontra todas as fotos dos seus eventos organizadas e prontas para visualização.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#sidebar-products",
                    popover: {
                        title: "Nossa Loja",
                        description: "Acesse a loja para comprar álbuns, arquivos digitais e outros produtos exclusivos.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#sidebar-orders",
                    popover: {
                        title: "Seus Pedidos",
                        description: "Acompanhe o status das suas compras e visualize o histórico de pedidos.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: "#cart-trigger",
                    popover: {
                        title: "Carrinho de Compras",
                        description: "Finalize suas compras e revise os itens selecionados aqui.",
                        side: "bottom",
                        align: "end",
                    },
                },
                {
                    element: "#user-menu-trigger",
                    popover: {
                        title: "Seu Perfil",
                        description: "Gerencie seus dados pessoais, endereço de entrega e altere sua senha.",
                        side: "bottom",
                        align: "end",
                    },
                },
            ],
            onDestroyed: () => {
                localStorage.setItem("hasSeenTutorial", "true")
                localStorage.removeItem("tutorialPending")
            },
        })

        driverObj.drive()
    }

    useEffect(() => {
        // Check if tutorial should run
        const pending = localStorage.getItem("tutorialPending")
        const hasSeen = localStorage.getItem("hasSeenTutorial")

        // Only run if user is client, authenticated, and specifically requested (via modal) OR hasn't seen it yet (optional policy)
        // For now, let's rely on the explicit flag set by FirstAccessModal to avoid annoying users every reload
        // BUT user asked for "tutorial de primeiro acesso", so maybe checking !hasSeen is good too? 
        // Let's stick to the "tutorialPending" flag OR if it's the very first time and no flag exists (maybe safer to trust the modal flow).

        // Better logic: 
        // 1. If "tutorialPending" is true -> Run it.
        // 2. If user wants to re-run (we can add a button later).

        if (user?.role === "client" && pending === "true") {
            // Small timeout to ensure UI is ready
            setTimeout(() => {
                startTour()
            }, 1000)
        }
    }, [user, pathname])

    // Expose startTour globally for manual trigger if needed
    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).startClientTour = startTour
        }
    }, [])

    return null
}
