'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Image } from 'lucide-react'

import { getOrderById } from '@/lib/api/orders-api'
import { formatDate, formatCurrency, translatePaymentStatus, translateProductType } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OrderDto } from '@/lib/order-types'
import { OrderItemPhotos } from '@/components/orders/order-item-photos'
import { useAuthStore } from '@/lib/store/auth-store'

export default function ClientOrderDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['client-order', id],
        queryFn: () => getOrderById(id),
        enabled: !!id,
    })

    // Verificação de segurança simples no front (idealmente o backend bloqueia)
    useEffect(() => {
        if (order && user && order.userId !== user.id) {
            router.push('/client/orders')
        }
    }, [order, user, router])

    const toggleItemExpansion = (itemId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev)
            if (newSet.has(itemId)) {
                newSet.delete(itemId)
            } else {
                newSet.add(itemId)
            }
            return newSet
        })
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

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-48 col-span-1" />
                    <Skeleton className="h-48 col-span-1" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="container mx-auto p-4">
                <p>Pedido não encontrado ou você não tem permissão para visualizá-lo.</p>
                <Link href="/client/orders">
                    <Button variant="link" className="pl-0">Voltar para meus pedidos</Button>
                </Link>
            </div>
        )
    }

    // Se o usuário não for o dono do pedido, não renderiza nada enquanto redireciona
    if (user && order.userId !== user.id) {
        return null
    }

    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="flex items-center gap-4">
                <Link href="/client/orders">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Pedido #{order.displayId}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>Status:</strong> <Badge variant={getStatusVariant(order.paymentStatus)}>{translatePaymentStatus(order.paymentStatus)}</Badge></p>
                        <p><strong>Data do Pedido:</strong> {formatDate(order.createdAt)}</p>
                        <p><strong>Valor Total:</strong> {formatCurrency(order.totalAmount)}</p>
                        {order.paymentStatus === 'PENDING' && order.items.length > 0 && (
                            <p className="text-sm text-yellow-600 mt-2">
                                Aguardando confirmação de pagamento.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Endereço de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{order.shippingAddress.street}, {order.shippingAddress.number} {order.shippingAddress.complement}</p>
                        <p>{order.shippingAddress.neighborhood} - {order.shippingAddress.city}, {order.shippingAddress.state}</p>
                        <p>CEP: {order.shippingAddress.zipCode}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Preço</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => {
                                const photos = item.details.filter(detail => detail.photoUrl)
                                const packages = item.details.filter(detail => detail.isPackage && detail.eventId)
                                const fullPackage = item.details.find(detail => detail.isPackage && !detail.eventId)
                                const isExpanded = expandedItems.has(item.id)
                                const hasPhotos = photos.length > 0
                                const hasPackages = packages.length > 0
                                const hasFullPackage = !!fullPackage
                                const hasDetails = hasPhotos || hasPackages || hasFullPackage

                                return (
                                    <>
                                        <TableRow
                                            key={item.id}
                                            className={hasDetails ? "cursor-pointer hover:bg-muted/50" : ""}
                                            onClick={hasDetails ? () => toggleItemExpansion(item.id) : undefined}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {hasDetails && (
                                                        <Image className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium">
                                                        {item.quantity > 1 && <span className="text-primary mr-1">{item.quantity}x</span>}
                                                        {item.productName}
                                                    </span>
                                                    {hasPhotos && (
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            {photos.length} foto{photos.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {hasPackages && (
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            {packages.length} evento{packages.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {hasFullPackage && (
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            Pacote completo
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{translateProductType(item.productType)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.itemPrice * item.quantity)}</TableCell>
                                            <TableCell>
                                                {hasDetails && (
                                                    isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {hasDetails && (
                                            <TableRow key={`${item.id}-details`}>
                                                <TableCell colSpan={4} className="p-0 border-0">
                                                    {hasPhotos && <OrderItemPhotos item={item} isExpanded={isExpanded} />}
                                                    {(hasPackages || hasFullPackage) && isExpanded && (
                                                        <div className="px-4 py-6 bg-muted/20">
                                                            {hasFullPackage ? (
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-3">Seleção:</h4>
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                                        <span className="font-medium">Pacote Completo - Todos os Eventos</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-3">Eventos Selecionados:</h4>
                                                                    <ul className="space-y-2">
                                                                        {packages.map((pkg, index) => (
                                                                            <li key={index} className="flex items-center gap-2 text-sm">
                                                                                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                                                <span>{pkg.eventName}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
