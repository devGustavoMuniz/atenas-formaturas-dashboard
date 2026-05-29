import { api } from '@/lib/api/axios-config'

export type DashboardAdminParams = {
  startDate?: string
  endDate?: string
  institutionId?: string
}

export type DashboardMetric = {
  value: number
  variationPercent: number
}

export type DashboardAdminResponse = {
  period: {
    startDate: string
    endDate: string
    previousStartDate: string
    previousEndDate: string
  }
  summary: {
    revenue: DashboardMetric
    orders: DashboardMetric
    pendingOrders: DashboardMetric
    activeStudents: DashboardMetric
  }
  revenueSeries: Array<{
    date: string
    revenue: number
    orders: number
  }>
  ordersByPaymentStatus: Array<{
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
    count: number
  }>
  itemsByFulfillmentStatus: Array<{
    status: 'ORDER_RECEIVED' | 'PHOTOS_SEPARATED' | 'PRODUCT_MANUFACTURED' | 'IN_TRANSIT' | 'DELIVERED' | 'SENT'
    count: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM'
    quantitySold: number
    revenue: number
  }>
  topInstitutions: Array<{
    institutionId: string
    institutionName: string
    contractNumber: string
    orders: number
    revenue: number
    activeStudents?: number
  }>
  recentOrders: Array<{
    id: string
    displayId: string
    userId: string
    userName: string
    institutionId: string
    institutionName: string
    contractNumber: string
    totalAmount: number
    paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
    createdAt: string
  }>
}

export async function fetchAdminDashboard(params: DashboardAdminParams = {}): Promise<DashboardAdminResponse> {
  const response = await api.get<DashboardAdminResponse>('/v1/dashboard/admin', {
    params: {
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      institutionId: params.institutionId || undefined,
    },
  })

  return response.data
}
