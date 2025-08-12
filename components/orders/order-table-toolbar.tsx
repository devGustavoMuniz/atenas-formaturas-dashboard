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
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="APPROVED">Aprovado</SelectItem>
            <SelectItem value="REJECTED">Recusado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'all' && (
          <Button variant="ghost" onClick={clearFilters} className="h-8 px-2 lg:px-3">
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
