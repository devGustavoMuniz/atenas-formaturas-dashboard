"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Building, Package } from "lucide-react"
import { useAuth } from "@/lib/auth/use-auth"

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
    title: "Produtos",
    href: "/products",
    icon: Package,
  },
]

const clientNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/client/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Produtos",
    href: "/client/products",
    icon: Package,
  },
]

interface DashboardNavProps {
  closeSidebar?: () => void
}

export function DashboardNav({ closeSidebar }: DashboardNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const currentNavItems = user?.role === "admin" ? adminNavItems : clientNavItems

  return (
    <nav className="grid items-start gap-2 p-4">
      {currentNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            className={cn("justify-start gap-2", isActive && "bg-muted font-medium text-yellow-500")}
            asChild
            onClick={closeSidebar}
          >
            <Link href={item.href}>
              <item.icon className={cn("h-4 w-4", isActive && "text-yellow-500")} />
              {item.title}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
