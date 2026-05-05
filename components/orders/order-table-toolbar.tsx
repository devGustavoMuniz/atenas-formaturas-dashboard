'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function OrderTableToolbar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('paymentStatus') ?? 'all'

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams)
    if (status === 'all') {
      params.delete('paymentStatus')
    } else {
      params.set('paymentStatus', status)
    }
    params.set('page', '1') // Reset to first page when filter changes
    router.push(`/orders?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('paymentStatus')
    params.set('page', '1')
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-10 w-[180px] rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-yellow-400">
            <SelectValue placeholder="Filtrar por status..." />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="APPROVED">Aprovado</SelectItem>
            <SelectItem value="COMPLETED">Concluído</SelectItem>
            <SelectItem value="REJECTED">Recusado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'all' && (
          <Button variant="ghost" onClick={clearFilters} className="h-8 px-2 text-zinc-300 hover:bg-white/5 hover:text-yellow-300 lg:px-3">
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
