'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'

import { UserName } from '@/components/users/user-name'
import { getOrders } from '@/lib/api/orders-api'
import { OrderDto } from '@/lib/order-types'
import { formatDate, formatCurrency } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OrderTableToolbar } from '@/components/orders/order-table-toolbar'
import Link from 'next/link'

export default function OrdersPage() {
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
    router.push(`?${params.toString()}`)
  }

  const getStatusVariant = (status: OrderDto['paymentStatus']) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>Gerencie os pedidos recebidos de todos os clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderTableToolbar />
          <div className="mt-4">
            {isLoading && !result ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                        <UserName userId={order.userId} />
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm">
                            Detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {result && result.meta.totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(result.meta.currentPage - 1)
                    }}
                    className={result.meta.currentPage === 1 ? 'pointer-events-none text-muted-foreground' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="p-2">
                    Página {result.meta.currentPage} de {result.meta.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(result.meta.currentPage + 1)
                    }}
                    className={
                      result.meta.currentPage === result.meta.totalPages
                        ? 'pointer-events-none text-muted-foreground'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
