'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  BarChart3,
  CalendarIcon,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  Package,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { fetchAdminDashboard, DashboardAdminResponse } from '@/lib/api/dashboard-api'
import { fetchInstitutions } from '@/lib/api/institutions-api'
import { cn, formatCurrency, formatDate, formatNumber, translatePaymentStatus, translateProductType } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendentes',
  APPROVED: 'Aprovados',
  REJECTED: 'Recusados',
  CANCELLED: 'Cancelados',
  COMPLETED: 'Concluidos',
}

const fulfillmentStatusLabels: Record<string, string> = {
  ORDER_RECEIVED: 'Recebidos',
  PHOTOS_SEPARATED: 'Fotos separadas',
  PRODUCT_MANUFACTURED: 'Confeccionados',
  IN_TRANSIT: 'Em rota',
  DELIVERED: 'Entregues',
  SENT: 'Enviados',
}

function getDefaultStartDate() {
  const date = new Date()
  date.setDate(1)
  return date
}

function getDefaultEndDate() {
  return new Date()
}

function toApiDate(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function AdminDashboardContent() {
  const [draftStartDate, setDraftStartDate] = useState<Date>(getDefaultStartDate)
  const [draftEndDate, setDraftEndDate] = useState<Date>(getDefaultEndDate)
  const [draftInstitutionId, setDraftInstitutionId] = useState('all')
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    startDate: toApiDate(getDefaultStartDate()),
    endDate: toApiDate(getDefaultEndDate()),
    institutionId: 'all',
  }))

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions', 'dashboard-filter'],
    queryFn: () => fetchInstitutions({ page: 1, limit: 100, sortBy: 'name', order: 'asc' }),
  })

  const dashboardParams = useMemo(() => ({
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate,
    institutionId: appliedFilters.institutionId === 'all' ? undefined : appliedFilters.institutionId,
  }), [appliedFilters])

  const hasPendingFilterChanges =
    appliedFilters.startDate !== toApiDate(draftStartDate) ||
    appliedFilters.endDate !== toApiDate(draftEndDate) ||
    appliedFilters.institutionId !== draftInstitutionId

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard', dashboardParams],
    queryFn: () => fetchAdminDashboard(dashboardParams),
  })

  if (isLoading) {
    return <DashboardLoading />
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
        Nao foi possivel carregar o dashboard. Verifique se o endpoint do backend esta disponivel.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-yellow-400/20 bg-zinc-950 p-5 text-white shadow-2xl shadow-black/20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,234,0,0.14),transparent_65%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Visao administrativa</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Vendas, pedidos, producao e contratos no periodo selecionado.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[760px] lg:grid-cols-[1fr_1fr_1.35fr_auto]">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Inicio</Label>
              <DashboardDatePicker
                date={draftStartDate}
                onSelect={setDraftStartDate}
                disabled={(date) => date > draftEndDate}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Fim</Label>
              <DashboardDatePicker
                date={draftEndDate}
                onSelect={setDraftEndDate}
                disabled={(date) => date < draftStartDate}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Contrato</Label>
              <Select value={draftInstitutionId} onValueChange={setDraftInstitutionId}>
                <SelectTrigger className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-100">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.contractNumber} - {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="self-end rounded-xl bg-yellow-400 font-semibold text-zinc-950 hover:bg-yellow-300 sm:col-span-2 lg:col-span-1"
              disabled={!hasPendingFilterChanges}
              onClick={() => {
                setAppliedFilters({
                  startDate: toApiDate(draftStartDate),
                  endDate: toApiDate(draftEndDate),
                  institutionId: draftInstitutionId,
                })
              }}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>

      <SummaryCards data={data} />

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="border-white/10 bg-zinc-950/70 text-white shadow-none xl:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-yellow-300" />
              Receita e pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueSeries} />
          </CardContent>
        </Card>

        <Card className="flex max-h-[438px] min-h-0 flex-col border-white/10 bg-zinc-950/70 text-white shadow-none xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-yellow-300" />
              Pedidos recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden">
            <RecentOrders orders={data.recentOrders} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StatusPanel
          title="Pedidos por pagamento"
          rows={data.ordersByPaymentStatus.map((row) => ({
            key: row.status,
            label: paymentStatusLabels[row.status] ?? row.status,
            value: row.count,
          }))}
        />
        <StatusPanel
          title="Itens por producao"
          rows={data.itemsByFulfillmentStatus.map((row) => ({
            key: row.status,
            label: fulfillmentStatusLabels[row.status] ?? row.status,
            value: row.count,
          }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankingPanel
          title="Produtos mais vendidos"
          emptyText="Nenhum produto vendido no periodo."
          rows={data.topProducts.map((product) => ({
            key: product.productId,
            title: product.productName,
            description: `${translateProductType(product.productType)} · ${formatNumber(product.quantitySold)} vendidos`,
            value: formatCurrency(product.revenue),
          }))}
        />
        <RankingPanel
          title="Contratos com mais pedidos"
          emptyText="Nenhum contrato com pedidos no periodo."
          rows={data.topInstitutions.map((institution) => ({
            key: institution.institutionId,
            title: `${institution.contractNumber} - ${institution.institutionName}`,
            description: `${formatNumber(institution.orders)} pedidos${institution.activeStudents ? ` · ${formatNumber(institution.activeStudents)} formandos ativos` : ''}`,
            value: formatCurrency(institution.revenue),
          }))}
        />
      </div>
    </div>
  )
}

function DashboardDatePicker({
  date,
  onSelect,
  disabled,
}: {
  date: Date
  onSelect: (date: Date) => void
  disabled?: (date: Date) => boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start rounded-xl border-white/10 bg-white/[0.03] text-left font-normal text-zinc-100 hover:bg-white/10 hover:text-yellow-300',
            !date && 'text-zinc-500'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-yellow-300" />
          {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-white/10 bg-zinc-950 p-0 text-zinc-100" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onSelect(selectedDate)
            }
          }}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function SummaryCards({ data }: { data: DashboardAdminResponse }) {
  const cards = [
    {
      title: 'Receita do periodo',
      value: formatCurrency(data.summary.revenue.value),
      variation: data.summary.revenue.variationPercent,
      icon: CircleDollarSign,
    },
    {
      title: 'Pedidos do periodo',
      value: formatNumber(data.summary.orders.value),
      variation: data.summary.orders.variationPercent,
      icon: ClipboardList,
    },
    {
      title: 'Pedidos pendentes',
      value: formatNumber(data.summary.pendingOrders.value),
      variation: data.summary.pendingOrders.variationPercent,
      icon: AlertCircle,
    },
    {
      title: 'Formandos ativos',
      value: formatNumber(data.summary.activeStudents.value),
      variation: data.summary.activeStudents.variationPercent,
      icon: GraduationCap,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = card.variation >= 0

        return (
          <Card key={card.title} className="border-white/10 bg-zinc-950/70 text-white shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-yellow-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">{card.value}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className={isPositive ? 'text-emerald-300' : 'text-red-300'}>
                  {isPositive ? '+' : ''}{card.variation.toFixed(1)}%
                </span>
                <span>vs. periodo anterior</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function RevenueChart({ data }: { data: DashboardAdminResponse['revenueSeries'] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatDate(item.date).replace(' de ', ' ').replace(' de ', ' '),
  }))

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value)).replace(',00', '')} />
          <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null

              return (
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm text-zinc-200 shadow-xl">
                  <p className="mb-2 font-medium text-white">{label}</p>
                  <p className="text-yellow-200">Receita: {formatCurrency(Number(payload[0]?.value ?? 0))}</p>
                  <p className="text-zinc-300">Pedidos: {formatNumber(Number(payload[1]?.value ?? 0))}</p>
                </div>
              )
            }}
          />
          <Bar yAxisId="left" dataKey="revenue" fill="#facc15" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="right" dataKey="orders" fill="#71717a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RecentOrders({ orders }: { orders: DashboardAdminResponse['recentOrders'] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum pedido recente no periodo.</p>
  }

  return (
    <div className="h-full max-h-[340px] space-y-3 overflow-y-auto pr-2">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="block rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-yellow-400/30 hover:bg-yellow-400/[0.04]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-sm font-medium text-yellow-200">#{order.displayId}</p>
              <p className="mt-1 truncate text-sm text-zinc-200">{order.userName}</p>
              <p className="truncate text-xs text-zinc-500">{order.contractNumber} - {order.institutionName}</p>
            </div>
            <Badge variant="outline" className="shrink-0 border-white/10 bg-white/[0.03] text-zinc-300">
              {translatePaymentStatus(order.paymentStatus)}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>{formatDate(order.createdAt)}</span>
            <span className="font-semibold text-zinc-100">{formatCurrency(order.totalAmount)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function StatusPanel({ title, rows }: { title: string; rows: Array<{ key: string; label: string; value: number }> }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <Card className="border-white/10 bg-zinc-950/70 text-white shadow-none">
      <CardHeader>
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Sem dados no periodo.</p>
        ) : rows.map((row) => {
          const percent = total > 0 ? (row.value / total) * 100 : 0

          return (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-300">{row.label}</span>
                <span className="font-semibold text-white">{formatNumber(row.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function RankingPanel({ title, emptyText, rows }: { title: string; emptyText: string; rows: Array<{ key: string; title: string; description: string; value: string }> }) {
  return (
    <Card className="border-white/10 bg-zinc-950/70 text-white shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-yellow-300" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-sm font-semibold text-yellow-200">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{row.title}</p>
                    <p className="truncate text-xs text-zinc-500">{row.description}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-zinc-100">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-40 rounded-[1.5rem] bg-zinc-800" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-32 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-32 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-32 rounded-2xl bg-zinc-800" />
      </div>
      <Skeleton className="h-96 rounded-2xl bg-zinc-800" />
    </div>
  )
}
