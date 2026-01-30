"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { getOrders } from "@/lib/api/orders-api"
import { OrderDto } from "@/lib/order-types"
import { formatDate, formatCurrency, translatePaymentStatus } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/auth-store"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function ClientOrdersPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const user = useAuthStore((state) => state.user)

    const pageIndex = parseInt(searchParams.get("page") ?? "1")
    // Clientes geralmente não precisam filtrar por status na listagem simples, mas podemos manter se quiser
    // Por enquanto vou simplificar e listar todos

    const { data: result, isLoading } = useQuery({
        queryKey: ["client-orders", user?.id, pageIndex],
        queryFn: () => getOrders({ pageIndex: pageIndex - 1, userId: user?.id }),
        enabled: !!user?.id,
        placeholderData: (previousData) => previousData,
    })

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", newPage.toString())
        router.push(`/client/orders?${params.toString()}`)
    }

    const getStatusVariant = (status: OrderDto["paymentStatus"]) => {
        switch (status) {
            case "APPROVED":
                return "success"
            case "COMPLETED":
                return "secondary"
            case "PENDING":
                return "warning"
            case "REJECTED":
            case "CANCELLED":
                return "destructive"
            default:
                return "outline"
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

    if (!result || result.data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Você ainda não possui pedidos.
            </div>
        )
    }

    return (
        <>
            <div className="mt-4">
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº Pedido</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Valor Total</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.data.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <span className="font-mono text-sm">{order.displayId}</span>
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
                                        <Link href={`/client/orders/${order.id}`}>
                                            <Button size="sm" variant="outline">Detalhes</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {result.data.map((order) => (
                        <div key={order.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm font-medium">#{order.displayId}</span>
                                    <Badge variant={getStatusVariant(order.paymentStatus)}>
                                        {translatePaymentStatus(order.paymentStatus)}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-xs">Data</span>
                                        <span>{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-muted-foreground text-xs">Valor Total</span>
                                        <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Link href={`/client/orders/${order.id}`} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            Ver Detalhes
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {(result.meta.totalPages > 1) && (
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
                        disabled={pageIndex >= result.meta.totalPages}
                    >
                        Próximo
                    </Button>
                </div>
            )}
        </>
    )
}
