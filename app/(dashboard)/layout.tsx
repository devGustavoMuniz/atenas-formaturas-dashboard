"use client"

import type React from "react"
import { useState } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 md:hidden">
            <MobileSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} closeSidebar={closeSidebar} />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="hidden md:flex md:items-center md:gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFEA00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserNav />
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className={`fixed top-16 z-30 h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block ${isSidebarOpen ? 'block' : 'hidden'}`}>
          <DashboardNav closeSidebar={closeSidebar} />
        </aside>
        <main className={`flex w-full flex-col overflow-hidden p-4 md:py-8 ${isSidebarOpen ? 'md:ml-[220px] lg:ml-[240px]' : ''}`}>{children}</main>
      </div>
    </div>
  )
}
