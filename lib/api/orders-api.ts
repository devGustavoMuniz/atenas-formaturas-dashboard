import { api } from '@/lib/api/axios-config'
import { OrderDto, OrderListResponseDto } from '@/lib/order-types'

interface GetOrdersParams {
  pageIndex?: number
  pageSize?: number
  paymentStatus?: string
}

export const getOrders = async ({
  pageIndex = 0,
  pageSize = 10,
  paymentStatus,
}: GetOrdersParams): Promise<OrderListResponseDto> => {
  const response = await api.get<OrderListResponseDto>('/v1/orders', {
    params: {
      page: pageIndex + 1, // API is 1-based, table is 0-based
      limit: pageSize,
      paymentStatus: paymentStatus || undefined,
    },
  })
  return response.data
}

export const getOrderById = async (id: string): Promise<OrderDto> => {
  const response = await api.get<OrderDto>(`/v1/orders/${id}`)
  return response.data
}


// A função createOrder foi mantida conforme encontrada no arquivo original.
// As interfaces CartItemDto e CreateOrderPayload são necessárias para ela.

export interface CartItemDto {
  productId: string
  productName: string
  productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM'
  totalPrice: number
  quantity: number
  selectionDetails: {
    photos?: Array<{ id: string; eventId: string }>
    events?: Array<{ id: string; isPackage: boolean }>
    isFullPackage?: boolean
    albumPhotos?: string[]
  }
}

export interface CreateOrderPayload {
  cartItems: CartItemDto[]
  shippingDetails: {
    zipCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  payer: {
    firstName: string
    lastName: string
    email: string
    phone: {
      areaCode: string
      number: string
    }
  }
}

export const createOrder = async (
  payload: CreateOrderPayload,
): Promise<{ orderId: string; mercadoPagoCheckoutUrl: string }> => {
  const { data } = await api.post<
    { orderId: string; mercadoPagoCheckoutUrl: string }
  >('/v1/orders', payload)
  return data
}

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  driveLink?: string
): Promise<OrderDto> => {
  const { data } = await api.put<OrderDto>(`/v1/orders/${orderId}/status`, {
    status,
    ...(driveLink && { driveLink })
  })
  return data
}