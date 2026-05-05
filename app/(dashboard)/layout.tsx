"use client"

import type React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { UserCredit } from "@/components/dashboard/user-credit"
import { CartSheet } from "@/components/cart/cart-sheet"
import { useAuth } from "@/lib/auth/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { ClientTutorial } from "@/components/client/client-tutorial"

const clientOnlyPrefixes = ["/client", "/checkout", "/payment"]
const adminOnlyPrefixes = ["/dashboard", "/users", "/orders", "/products", "/institutions"]

function isRoute(pathname: string | null, routes: string[]) {
  return routes.some((route) => pathname === route || pathname?.startsWith(`${route}/`))
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const isRoleMismatch =
    (user?.role === "client" && isRoute(pathname, adminOnlyPrefixes)) ||
    (user?.role === "admin" && isRoute(pathname, clientOnlyPrefixes))

  if (isLoading || !user || isRoleMismatch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-yellow-500" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <ClientTutorial />
      <Sidebar collapsible="icon" className="border-r border-yellow-400/15">
        <SidebarHeader className="border-b border-white/10">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#999] ring-1 ring-yellow-400/25">
              <Image
                src="/favicon.png"
                alt="Atenas Formaturas"
                width={44}
                height={42}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <h1 className="truncate text-sm font-semibold text-white">Atenas Formaturas</h1>
              <p className="truncate text-xs text-yellow-300/80">
                {user?.role === "client" ? "Área do cliente" : "Painel administrativo"}
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-zinc-950">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-zinc-950/95 px-4 text-white backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85">
          <SidebarTrigger id="mobile-menu-trigger" className="-ml-1 text-zinc-300 hover:bg-white/5 hover:text-yellow-300" />
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="flex items-center gap-2 md:hidden">
              <h1 className="text-lg font-semibold text-white">
                {user?.role === 'client' ? 'Atenas Formaturas' : 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <UserCredit />
              {user?.role === 'client' && <CartSheet />}
              <UserNav />
            </div>
          </div>
        </header>
        <div className="min-w-0 flex flex-1 flex-col gap-4 bg-zinc-950 p-4 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
