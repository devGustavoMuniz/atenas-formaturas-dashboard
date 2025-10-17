'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { UserName } from '@/components/users/user-name'
import { getOrders } from '@/lib/api/orders-api'
import { OrderDto } from '@/lib/order-types'
import { formatDate, formatCurrency, translatePaymentStatus } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OrderTableToolbar } from '@/components/orders/order-table-toolbar'

export function OrdersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

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
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <>
      <OrderTableToolbar />
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result?.data.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <span className="font-mono text-sm">{order.displayId}</span>
                </TableCell>
                <TableCell>
                  <UserName userId={order.userId} />
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.paymentStatus)}>
                    {translatePaymentStatus(order.paymentStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Link href={`/orders/${order.id}`}>
                    <Button size="sm">Detalhes</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pageIndex - 1)}
          disabled={pageIndex === 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pageIndex + 1)}
          disabled={!result || pageIndex >= result.meta.totalPages}
        >
          Próximo
        </Button>
      </div>
    </>
  )
}
