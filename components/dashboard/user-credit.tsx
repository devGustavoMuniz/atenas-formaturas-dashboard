"use client"

import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { Wallet } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function UserCredit() {
  const user = useAuthStore((state) => state.user)
  const items = useCartStore((state) => state.items)

  if (!user || user.role !== "client") {
    return null
  }

  // O backend retorna:
  // creditValue: Saldo disponível para uso imediato
  // creditReserved: Saldo bloqueado em pedidos pendentes
  const availableBalance = user.creditValue ?? 0
  const backendReserved = user.creditReserved ?? 0

  // Para o Badge principal, vamos mostrar o saldo que ele REALMENTE tem disponível no backend
  // e apenas o que está REALMENTE reservado no backend.
  const mainBadgeAvailable = availableBalance
  const mainBadgeReserved = backendReserved

  // Cálculo do impacto do carrinho (apenas para o Tooltip)
  const cartTotal = items.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0)
  const cartImpact = Math.min(availableBalance, cartTotal)
  const finalBalanceAfterCart = Math.max(0, availableBalance - cartImpact)

  const hasBackendReservation = backendReserved > 0
  const hasCartImpact = cartImpact > 0

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${hasBackendReservation
              ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-muted hover:bg-muted/80'
            }`}>
            <Wallet className={`h-4 w-4 ${hasBackendReservation
                ? 'text-yellow-600 dark:text-yellow-500'
                : 'text-yellow-500'
              }`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">
                {formatCurrency(mainBadgeAvailable)}
              </span>
              {hasBackendReservation && (
                <span className="text-[10px] text-yellow-700 dark:text-yellow-400 leading-tight">
                  {formatCurrency(mainBadgeReserved)} reservado
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-yellow-500" />
              Resumo de Créditos
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Saldo total:</span>
                <span className="font-medium">{formatCurrency(availableBalance + backendReserved)}</span>
              </div>

              {hasBackendReservation && (
                <div className="flex justify-between gap-4 text-orange-600 dark:text-orange-400">
                  <span>Bloqueado em pedidos:</span>
                  <span className="font-medium">-{formatCurrency(backendReserved)}</span>
                </div>
              )}

              <div className="flex justify-between gap-4 pt-1 border-t font-medium">
                <span>Disponível para uso:</span>
                <span className="text-green-600 dark:text-green-500">{formatCurrency(availableBalance)}</span>
              </div>

              {hasCartImpact && (
                <div className="mt-2 p-2 rounded bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50">
                  <p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-300 uppercase mb-1">Simulação do Carrinho</p>
                  <div className="flex justify-between gap-4 text-yellow-700 dark:text-yellow-400">
                    <span>Uso previsto no carrinho:</span>
                    <span className="font-medium">-{formatCurrency(cartImpact)}</span>
                  </div>
                  <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-yellow-200 dark:border-yellow-800 font-bold">
                    <span>Saldo após checkout:</span>
                    <span>{formatCurrency(finalBalanceAfterCart)}</span>
                  </div>
                </div>
              )}

              {!hasBackendReservation && !hasCartImpact && (
                <p className="text-muted-foreground italic mt-2">
                  Você não possui reservas de crédito no momento.
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
