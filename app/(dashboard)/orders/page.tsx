import { Suspense } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrdersPageContent } from './orders-page-content'

function OrdersPageSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>
            Gerencie os pedidos recebidos de todos os clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OrdersPageSkeleton />}>
            <OrdersPageContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}