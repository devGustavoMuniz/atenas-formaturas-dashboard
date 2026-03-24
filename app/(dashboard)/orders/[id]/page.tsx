'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Image } from 'lucide-react'

import { UserName } from '@/components/users/user-name'
import { getOrderById, cancelOrder, updateItemFulfillmentStatus } from '@/lib/api/orders-api'
import { formatDate, formatCurrency, translatePaymentStatus, translateProductType } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { OrderDto, FulfillmentStatus } from '@/lib/order-types'
import { OrderItemPhotos } from '@/components/orders/order-item-photos'
import { OrderItemTimeline } from '@/components/orders/order-item-timeline'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OrderDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showDriveLinkModal, setShowDriveLinkModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [driveLink, setDriveLink] = useState('')
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [pendingFulfillment, setPendingFulfillment] = useState<{ itemId: string; status: FulfillmentStatus } | null>(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  })

  const { mutate: updateFulfillment } = useMutation({
    mutationFn: ({ itemId, status, driveLink: link }: { itemId: string; status: FulfillmentStatus; driveLink?: string }) =>
      updateItemFulfillmentStatus(id, itemId, status, link),
    onMutate: async ({ itemId, status }) => {
      setUpdatingItemId(itemId)
      await queryClient.cancelQueries({ queryKey: ['order', id] })
      const previous = queryClient.getQueryData<OrderDto>(['order', id])
      queryClient.setQueryData(['order', id], (old: OrderDto | undefined) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map(item =>
            item.id === itemId ? { ...item, fulfillmentStatus: status } : item
          ),
        }
      })
      return { previous }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['order', id], context.previous)
      }
      toast({ variant: 'destructive', title: 'Erro ao atualizar etapa', description: error.message })
    },
    onSettled: () => setUpdatingItemId(null),
  })

  const { mutate: cancelOrderMutation, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: (data) => {
      const creditMessage = data.creditReleased > 0
        ? `Crédito de ${formatCurrency(data.creditReleased)} foi devolvido ao cliente.`
        : ''

      toast({
        title: "Pedido cancelado com sucesso!",
        description: creditMessage
      })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowCancelModal(false)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar pedido",
        description: error.message
      })
    },
  })

  const handleFulfillmentChange = (itemId: string, status: FulfillmentStatus) => {
    const item = order?.items.find(i => i.id === itemId)
    if (item?.productType === 'DIGITAL_FILES' && status === 'SENT') {
      setPendingFulfillment({ itemId, status })
      setShowDriveLinkModal(true)
    } else {
      updateFulfillment({ itemId, status })
    }
  }

  const handleConfirmWithDriveLink = () => {
    if (!driveLink.trim()) {
      toast({
        variant: "destructive",
        title: "Link do Google Drive é obrigatório",
        description: "Por favor, insira o link do Google Drive para enviar os arquivos digitais ao cliente."
      })
      return
    }
    if (!pendingFulfillment) return
    updateFulfillment({ itemId: pendingFulfillment.itemId, status: pendingFulfillment.status, driveLink })
    setShowDriveLinkModal(false)
    setDriveLink('')
    setPendingFulfillment(null)
  }

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 col-span-1" />
          <Skeleton className="h-48 col-span-2" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <p>Pedido não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl">Detalhes do Pedido: {order.displayId}</h1>
        </div>

        <div className="flex gap-2 sm:flex-row flex-col">
          {(order.paymentStatus === 'APPROVED' || order.paymentStatus === 'PENDING') && (
            <Button
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              variant="destructive"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar Pedido'}
            </Button>
          )}

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Status:</strong> <Badge variant={getStatusVariant(order.paymentStatus)}>{translatePaymentStatus(order.paymentStatus)}</Badge></p>
            <p><strong>Data:</strong> {formatDate(order.createdAt)}</p>
            <p><strong>Valor Total:</strong> {formatCurrency(order.totalAmount)}</p>
            <p><strong>Cliente:</strong> ({order.contractNumber}) <UserName userId={order.userId} /></p>
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
        <CardContent className="space-y-3 p-3 pt-0">
          {order.items.map((item) => {
            const photos = item.details.filter(detail => detail.photoUrl)
            const packages = item.details.filter(detail => detail.isPackage && detail.eventId)
            const fullPackage = item.details.find(detail => detail.isPackage && !detail.eventId)
            const isExpanded = expandedItems.has(item.id)
            const hasPhotos = photos.length > 0
            const hasPackages = packages.length > 0
            const hasFullPackage = !!fullPackage
            const hasDetails = hasPhotos || hasPackages || hasFullPackage
            const showTimeline = order.paymentStatus === 'APPROVED' || order.paymentStatus === 'COMPLETED'

            return (
              <div key={item.id} className="rounded-lg border overflow-hidden">
                {/* Item header */}
                <div
                  className={`flex items-start gap-3 px-4 py-3 ${hasDetails ? 'cursor-pointer hover:bg-muted/40' : ''}`}
                  onClick={hasDetails ? () => toggleItemExpansion(item.id) : undefined}
                >
                  {hasDetails && (
                    <Image className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {item.quantity > 1 && <span className="text-primary mr-1">{item.quantity}x</span>}
                        {item.productName}
                      </span>
                      {hasDetails && (
                        isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-normal">{translateProductType(item.productType)}</Badge>
                      {hasPhotos && (
                        <span className="text-xs text-muted-foreground">{photos.length} foto{photos.length > 1 ? 's' : ''}</span>
                      )}
                      {hasPackages && (
                        <span className="text-xs text-muted-foreground">{packages.length} evento{packages.length > 1 ? 's' : ''}</span>
                      )}
                      {hasFullPackage && (
                        <span className="text-xs text-muted-foreground">Pacote completo</span>
                      )}
                      <span className="text-sm font-semibold ml-auto">{formatCurrency(item.itemPrice * item.quantity)}</span>
                    </div>
                  </div>
                </div>

                {/* Expandable details */}
                {hasDetails && (
                  <>
                    {hasPhotos && <OrderItemPhotos item={item} isExpanded={isExpanded} />}
                    {(hasPackages || hasFullPackage) && isExpanded && (
                      <div className="px-4 py-4 bg-muted/20 border-t">
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
                  </>
                )}

                {/* Timeline */}
                {showTimeline && (
                  <div className="px-4 py-4 bg-muted/5 border-t">
                    <OrderItemTimeline
                      item={item}
                      onStatusChange={handleFulfillmentChange}
                      isLoading={updatingItemId === item.id}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={showDriveLinkModal} onOpenChange={setShowDriveLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link do Google Drive</DialogTitle>
            <DialogDescription>
              Insira o link do Google Drive com os arquivos digitais para o cliente antes de marcar o item como enviado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="driveLink">Link do Google Drive</Label>
              <Input
                id="driveLink"
                placeholder="https://drive.google.com/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmWithDriveLink()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDriveLinkModal(false)
                setDriveLink('')
                setPendingFulfillment(null)
              }}
              disabled={pendingFulfillment ? updatingItemId === pendingFulfillment.itemId : false}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmWithDriveLink}
              disabled={pendingFulfillment ? updatingItemId === pendingFulfillment.itemId : false}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirmar e Marcar como Enviado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
              {order && order.totalAmount > 0 && (
                <span className="block mt-2 font-medium text-foreground">
                  O crédito utilizado (se houver) será devolvido ao cliente automaticamente.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelOrderMutation()}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
