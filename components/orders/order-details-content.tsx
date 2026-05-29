'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, FileText, Image as ImageIcon } from 'lucide-react'

import { OrderItemPhotos } from '@/components/orders/order-item-photos'
import { OrderItemTimeline } from '@/components/orders/order-item-timeline'
import { UserName } from '@/components/users/user-name'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { cancelOrder, getOrderById, updateItemFulfillmentStatus } from '@/lib/api/orders-api'
import { useAuth } from '@/lib/auth/use-auth'
import { generateOrderReportPdf } from '@/lib/order-report-pdf'
import { FulfillmentStatus, OrderDto } from '@/lib/order-types'
import { cn, formatCurrency, formatDate, translatePaymentStatus, translateProductType } from '@/lib/utils'

interface OrderDetailsContentProps {
  orderId: string
  compact?: boolean
}

export function OrderDetailsContent({ orderId, compact = false }: OrderDetailsContentProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showDriveLinkModal, setShowDriveLinkModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [driveLink, setDriveLink] = useState('')
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [pendingFulfillment, setPendingFulfillment] = useState<{ itemId: string; status: FulfillmentStatus } | null>(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  })

  const { mutate: updateFulfillment } = useMutation({
    mutationFn: ({ itemId, status, driveLink: link }: { itemId: string; status: FulfillmentStatus; driveLink?: string }) =>
      updateItemFulfillmentStatus(orderId, itemId, status, link),
    onMutate: async ({ itemId, status }) => {
      setUpdatingItemId(itemId)
      await queryClient.cancelQueries({ queryKey: ['order', orderId] })
      const previous = queryClient.getQueryData<OrderDto>(['order', orderId])

      queryClient.setQueryData(['order', orderId], (old: OrderDto | undefined) => {
        if (!old) return old

        return {
          ...old,
          items: old.items.map((item) => (item.id === itemId ? { ...item, fulfillmentStatus: status } : item)),
        }
      })

      return { previous }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['order', orderId], context.previous)
      }

      toast({ variant: 'destructive', title: 'Erro ao atualizar etapa', description: error.message })
    },
    onSettled: () => setUpdatingItemId(null),
  })

  const { mutate: cancelOrderMutation, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: (data) => {
      const creditMessage = data.creditReleased > 0
        ? `Crédito de ${formatCurrency(data.creditReleased)} foi devolvido ao cliente.`
        : ''

      toast({
        title: 'Pedido cancelado com sucesso!',
        description: creditMessage,
      })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowCancelModal(false)
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar pedido',
        description: error.message,
      })
    },
  })

  const handleFulfillmentChange = (itemId: string, status: FulfillmentStatus) => {
    const item = order?.items.find((currentItem) => currentItem.id === itemId)

    if (item?.productType === 'DIGITAL_FILES' && status === 'SENT') {
      setPendingFulfillment({ itemId, status })
      setShowDriveLinkModal(true)
      return
    }

    updateFulfillment({ itemId, status })
  }

  const handleConfirmWithDriveLink = () => {
    if (!driveLink.trim()) {
      toast({
        variant: 'destructive',
        title: 'Link do Google Drive é obrigatório',
        description: 'Por favor, insira o link do Google Drive para enviar os arquivos digitais ao cliente.',
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
    setExpandedItems((prev) => {
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
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl bg-zinc-800" />
        <div className={cn('grid grid-cols-1 gap-4', !compact && 'lg:grid-cols-2')}>
          <Skeleton className="h-44 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-44 rounded-2xl bg-zinc-800" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl bg-zinc-800" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-300">
        Pedido não encontrado.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">Pedido</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold text-white sm:text-2xl">#{order.displayId}</h2>
            <Badge variant={getStatusVariant(order.paymentStatus)}>
              {translatePaymentStatus(order.paymentStatus)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => generateOrderReportPdf(order, { fallbackBuyerCpf: user?.cpf })}
            className="rounded-xl bg-yellow-400 font-semibold text-zinc-950 hover:bg-yellow-300"
          >
            <FileText className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>

          {(order.paymentStatus === 'APPROVED' || order.paymentStatus === 'PENDING') && (
            <Button
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              variant="destructive"
              className="rounded-xl"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar Pedido'}
            </Button>
          )}
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-4', !compact && 'lg:grid-cols-2')}>
        <Card className="border-white/10 bg-white/[0.03] text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-white">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <InfoRow label="Status">
              <Badge variant={getStatusVariant(order.paymentStatus)}>{translatePaymentStatus(order.paymentStatus)}</Badge>
            </InfoRow>
            <InfoRow label="Data">{formatDate(order.createdAt)}</InfoRow>
            <InfoRow label="Valor Total">{formatCurrency(order.totalAmount)}</InfoRow>
            <InfoRow label="Cliente">
              ({order.contractNumber}) <UserName userId={order.userId} />
            </InfoRow>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-white">Endereço de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {order.shippingAddress ? (
              <>
                <p>
                  {order.shippingAddress.street}, {order.shippingAddress.number} {order.shippingAddress.complement}
                </p>
                <p>
                  {order.shippingAddress.neighborhood} - {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>CEP: {order.shippingAddress.zipCode}</p>
              </>
            ) : (
              <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] p-3 text-yellow-100">
                Endereço ainda não informado para este pedido.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.03] text-white shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0">
          {order.items.map((item) => {
            const photos = item.details.filter((detail) => detail.photoUrl)
            const packages = item.details.filter((detail) => detail.isPackage && detail.eventId)
            const fullPackage = item.details.find((detail) => detail.isPackage && !detail.eventId)
            const isExpanded = expandedItems.has(item.id)
            const hasPhotos = photos.length > 0
            const hasPackages = packages.length > 0
            const hasFullPackage = !!fullPackage
            const hasDetails = hasPhotos || hasPackages || hasFullPackage
            const showTimeline = order.paymentStatus === 'APPROVED' || order.paymentStatus === 'COMPLETED'

            return (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70">
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                    hasDetails ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'
                  )}
                  onClick={hasDetails ? () => toggleItemExpansion(item.id) : undefined}
                >
                  {hasDetails && (
                    <ImageIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-300" />
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-zinc-100">
                        {item.quantity > 1 && <span className="mr-1 text-yellow-300">{item.quantity}x</span>}
                        {item.productName}
                      </span>
                      {hasDetails && (
                        isExpanded
                          ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                          : <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <Badge variant="outline" className="border-yellow-400/30 bg-yellow-400/10 text-xs font-normal text-yellow-200">
                        {translateProductType(item.productType)}
                      </Badge>
                      {hasPhotos && <span>{photos.length} foto{photos.length > 1 ? 's' : ''}</span>}
                      {hasPackages && <span>{packages.length} evento{packages.length > 1 ? 's' : ''}</span>}
                      {hasFullPackage && <span>Pacote completo</span>}
                      <span className="ml-auto text-sm font-semibold text-zinc-100">
                        {formatCurrency(item.itemPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </button>

                {hasDetails && (
                  <>
                    {hasPhotos && <OrderItemPhotos item={item} isExpanded={isExpanded} />}
                    {(hasPackages || hasFullPackage) && isExpanded && (
                      <div className="border-t border-white/10 bg-white/[0.03] px-4 py-4">
                        {hasFullPackage ? (
                          <div>
                            <h4 className="mb-3 text-sm font-medium text-zinc-100">Seleção:</h4>
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <div className="h-2 w-2 rounded-full bg-yellow-400" />
                              <span className="font-medium">Pacote Completo - Todos os Eventos</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="mb-3 text-sm font-medium text-zinc-100">Eventos Selecionados:</h4>
                            <ul className="space-y-2">
                              {packages.map((pkg, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
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

                {showTimeline && (
                  <div className="border-t border-white/10 bg-white/[0.02] px-4 py-4">
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
                onChange={(event) => setDriveLink(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
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
              className="bg-green-600 text-white hover:bg-green-700"
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
              {order.totalAmount > 0 && (
                <span className="mt-2 block font-medium text-foreground">
                  O crédito utilizado, se houver, será devolvido ao cliente automaticamente.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={() => cancelOrderMutation()} disabled={isCancelling}>
              {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      <span className="text-zinc-200 sm:text-right">{children}</span>
    </div>
  )
}
