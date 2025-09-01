"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Don't redirect until the store has been hydrated
    if (!_hasHydrated) {
      return
    }

    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.replace("/dashboard")
      } else {
        router.replace("/client/dashboard")
      }
    } else {
      router.replace("/login")
    }
  }, [isAuthenticated, user, router, _hasHydrated])

  // Show a loading state while the auth store is hydrating
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="w-1/2 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
    </div>
  )
}