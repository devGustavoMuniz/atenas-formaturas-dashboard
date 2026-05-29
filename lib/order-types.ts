
export type FulfillmentStatus =
  | 'ORDER_RECEIVED'
  | 'PHOTOS_SEPARATED'
  | 'PRODUCT_MANUFACTURED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'SENT'

export interface OrderItemDetailsDto {
  id?: string;
  orderItemId?: string;
  photoUrl?: string;
  photoName?: string;
  photoId?: string;
  eventId?: string;
  eventName?: string;
  isPackage?: boolean;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM';
  itemPrice: number;
  quantity: number;
  fulfillmentStatus: FulfillmentStatus;
  completedAt?: string;
  createdAt: string;
  details: OrderItemDetailsDto[];
}

export interface OrderDto {
  id: string;
  displayId: string;
  userId: string;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  paymentGatewayId?: string;
  contractNumber: string;
  creditUsed?: number;
  shippingAddress?: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  checkoutUrl?: string;
  report?: OrderReportDto;
}

export interface OrderListResponseDto {
  data: OrderDto[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface OrderReportDto {
  saleDate: string;
  contractNumber: string;
  student: {
    name: string;
  };
  buyer: {
    name: string;
    cpf?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  amounts: {
    orderAmount: number;
    atenasCreditUsed: number;
    mercadoPagoFee?: number | null;
    netReceivedAmount?: number | null;
    totalPaidAmount?: number | null;
  };
  payment: {
    provider: 'MERCADO_PAGO' | 'CREDIT' | 'FREE' | 'UNKNOWN';
    status: string;
    methodId?: string | null;
    methodType?: string | null;
    installments?: number | null;
    installmentAmount?: number | null;
    description: string;
  };
  delivery?: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    phone?: string | null;
    email?: string | null;
  } | null;
}
