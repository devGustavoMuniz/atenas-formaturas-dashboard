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
        const isMobile = window.innerWidth < 768

        const desktopSteps = [
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
        ]

        // No mobile, os itens de navegação ficam dentro do menu lateral (Sheet).
        // Para evitar conflitos de z-index com o overlay do driver.js, cada seção
        // é explicada apontando para o botão do menu — padrão comum em tours mobile.
        const mobileSteps = [
            {
                element: "#mobile-menu-trigger",
                popover: {
                    title: "Menu de Navegação",
                    description: "Toque aqui para abrir o menu e acessar todas as seções do aplicativo.",
                    side: "bottom",
                    align: "start",
                },
            },
            {
                element: "#mobile-menu-trigger",
                popover: {
                    title: "📸 Galeria de Fotos",
                    description: "No menu, acesse a Galeria com todas as fotos dos seus eventos, organizadas e prontas para visualização.",
                    side: "bottom",
                    align: "start",
                },
            },
            {
                element: "#mobile-menu-trigger",
                popover: {
                    title: "🛍️ Nossa Loja",
                    description: "No menu, acesse a Loja para comprar álbuns, arquivos digitais e outros produtos exclusivos.",
                    side: "bottom",
                    align: "start",
                },
            },
            {
                element: "#mobile-menu-trigger",
                popover: {
                    title: "📦 Seus Pedidos",
                    description: "No menu, acompanhe o status das suas compras e visualize o histórico completo de pedidos.",
                    side: "bottom",
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
        ]

        const driverObj = driver({
            showProgress: true,
            animate: true,
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            doneBtnText: "Concluir",
            steps: (isMobile ? mobileSteps : desktopSteps) as any,
            onDestroyed: () => {
                localStorage.setItem("hasSeenTutorial", "true")
                localStorage.removeItem("tutorialPending")
            },
        })

        driverObj.drive()
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).startClientTour = startTour
        }

        const pending = localStorage.getItem("tutorialPending")

        if (user?.role === "client" && pending === "true") {
            setTimeout(() => {
                startTour()
            }, 1000)
        }
    }, [user, pathname])

    return null
}
