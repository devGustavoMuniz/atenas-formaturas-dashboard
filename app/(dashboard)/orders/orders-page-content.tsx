'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Eye } from 'lucide-react'

import { OrderDetailsContent } from '@/components/orders/order-details-content'
import { OrderTableToolbar } from '@/components/orders/order-table-toolbar'
import { UserName } from '@/components/users/user-name'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getOrders } from '@/lib/api/orders-api'
import { OrderDto } from '@/lib/order-types'
import { formatCurrency, formatDate, translatePaymentStatus } from '@/lib/utils'

export function OrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const pageIndex = parseInt(searchParams.get('page') ?? '1')
  const paymentStatus = searchParams.get('paymentStatus') ?? undefined

  const { data: result, isLoading } = useQuery({
    queryKey: ['orders', pageIndex, paymentStatus],
    queryFn: () => getOrders({ pageIndex: pageIndex - 1, paymentStatus }),
    placeholderData: (previousData) => previousData,
  })

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/orders?${params.toString()}`)
  }

  const openOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDetailsOpen(true)
  }

  const getStatusVariant = (status: OrderDto['paymentStatus']) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'COMPLETED':
        return 'secondary'
      case 'PENDING':
        return 'warning'
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (isLoading && !result) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-8 w-full bg-zinc-800" />
        <Skeleton className="h-8 w-full bg-zinc-800" />
        <Skeleton className="h-8 w-full bg-zinc-800" />
        <Skeleton className="h-8 w-full bg-zinc-800" />
        <Skeleton className="h-8 w-full bg-zinc-800" />
      </div>
    )
  }

  return (
    <>
      <OrderTableToolbar />

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 md:block">
        <Table>
          <TableHeader className="bg-white/[0.04]">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400">ID</TableHead>
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Data</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-right text-zinc-400">Valor Total</TableHead>
              <TableHead className="text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result?.data.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer border-white/10 hover:bg-white/[0.04]"
                onClick={() => openOrderDetails(order.id)}
              >
                <TableCell className="text-zinc-100">
                  <span className="font-mono text-sm text-yellow-200">{order.displayId}</span>
                </TableCell>
                <TableCell className="text-zinc-100">
                  <UserName userId={order.userId} />
                </TableCell>
                <TableCell className="text-zinc-300">{formatDate(order.createdAt)}</TableCell>
                <TableCell className="text-zinc-100">
                  <Badge variant={getStatusVariant(order.paymentStatus)}>
                    {translatePaymentStatus(order.paymentStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-zinc-100">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-xl text-zinc-300 hover:bg-yellow-400/10 hover:text-yellow-300"
                    onClick={(event) => {
                      event.stopPropagation()
                      openOrderDetails(order.id)
                    }}
                    aria-label={`Abrir pedido ${order.displayId}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 flex flex-col gap-3 md:hidden">
        {result?.data.map((order) => (
          <button
            key={order.id}
            type="button"
            className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-yellow-400/30 hover:bg-yellow-400/[0.04]"
            onClick={() => openOrderDetails(order.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-mono text-sm font-medium text-yellow-200">#{order.displayId}</span>
                <p className="text-sm text-zinc-400">
                  <UserName userId={order.userId} />
                </p>
              </div>
              <Badge variant={getStatusVariant(order.paymentStatus)}>
                {translatePaymentStatus(order.paymentStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{formatDate(order.createdAt)}</span>
              <span className="text-sm font-semibold text-zinc-100">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] px-3 py-2 text-sm font-semibold text-yellow-200">
              <span>Abrir detalhes</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end space-x-2 py-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
          onClick={() => handlePageChange(pageIndex - 1)}
          disabled={pageIndex === 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
          onClick={() => handlePageChange(pageIndex + 1)}
          disabled={!result || pageIndex >= result.meta.totalPages}
        >
          Próximo
        </Button>
      </div>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full overflow-y-auto border-l border-yellow-400/20 bg-zinc-950 p-0 text-white sm:max-w-3xl">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur sm:px-6">
            <SheetHeader>
              <SheetTitle className="text-left text-white">Detalhes do pedido</SheetTitle>
            </SheetHeader>
          </div>

          <div className="p-4 sm:p-6">
            {selectedOrderId && <OrderDetailsContent orderId={selectedOrderId} compact />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
