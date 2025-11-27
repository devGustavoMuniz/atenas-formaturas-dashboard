"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Building,
  Package,
  ShoppingCart,
} from "lucide-react"
import { useAuth } from "@/lib/auth/use-auth"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Contratos",
    href: "/institutions",
    icon: Building,
  },
  {
    title: "Usuários",
    href: "/users",
    icon: Users,
  },
  {
    title: "Pedidos",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Produtos",
    href: "/products",
    icon: Package,
  },
]

const clientNavItems: NavItem[] = [
  {
    title: "Produtos",
    href: "/client/products",
    icon: Package,
  },
  {
    title: "Galeria",
    href: "/client/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Meus Pedidos",
    href: "/client/orders",
    icon: ShoppingCart,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const currentNavItems = user?.role === "admin" ? adminNavItems : clientNavItems

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-2">
        {currentNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={isActive ? "bg-muted text-yellow-500 data-[active=true]:text-yellow-500 px-3 py-5" : "hover:bg-muted px-3 py-5"}
              >
                <Link href={item.href}>
                  <item.icon className={isActive ? "text-yellow-500" : ""} />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
