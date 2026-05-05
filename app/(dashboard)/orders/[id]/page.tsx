'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { OrderDetailsContent } from '@/components/orders/order-details-content'
import { Button } from '@/components/ui/button'

export default function OrderDetailsPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-yellow-400/20 bg-zinc-950 p-4 text-white shadow-2xl shadow-black/20 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,234,0,0.14),transparent_65%)]" />

      <div className="relative space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">Pedidos</p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Detalhes do pedido</h1>
          </div>
        </div>

        <OrderDetailsContent orderId={id} />
      </div>
    </div>
  )
}
