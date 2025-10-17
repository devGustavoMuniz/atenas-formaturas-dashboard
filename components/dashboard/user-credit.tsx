"use client"

import { useAuthStore } from "@/lib/store/auth-store"
import { formatCurrency } from "@/lib/utils"
import { Wallet } from "lucide-react"

export function UserCredit() {
  const user = useAuthStore((state) => state.user)

  if (!user || user.role !== "client") {
    return null
  }

  const creditValue = user.creditValue ?? 0

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
      <Wallet className="h-4 w-4 text-yellow-500" />
      <span className="text-sm font-medium">
        {formatCurrency(creditValue)}
      </span>
    </div>
  )
}
