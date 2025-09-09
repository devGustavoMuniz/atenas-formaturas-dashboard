
export interface OrderItemDetailsDto {
  id: string;
  orderItemId: string;
  photoId?: string;
  eventId?: string;
  isPackage?: boolean;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM';
  itemPrice: number;
  createdAt: string;
  details: OrderItemDetailsDto[];
}

export interface OrderDto {
  id: string;
  displayId: string;
  userId: string;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  paymentGatewayId?: string;
  shippingAddress: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
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
