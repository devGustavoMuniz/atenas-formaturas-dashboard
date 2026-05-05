"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (user) {
      if (user.role === "admin") {
        router.replace("/dashboard")
      } else {
        router.replace("/client/products")
      }
    } else {
      router.replace("/login")
    }
  }, [isLoading, user, router])

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
