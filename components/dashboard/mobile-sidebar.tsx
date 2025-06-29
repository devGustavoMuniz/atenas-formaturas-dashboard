"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"

interface MobileSidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  closeSidebar: () => void
}

export function MobileSidebar({ isOpen, setIsOpen, closeSidebar }: MobileSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <DashboardNav closeSidebar={closeSidebar} />
      </SheetContent>
    </Sheet>
  )
}
