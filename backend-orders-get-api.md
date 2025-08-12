# Especificação Técnica: API de Consulta de Pedidos

Este documento detalha os requisitos para os endpoints de consulta (GET) de pedidos no backend (NestJS), que servirão ao dashboard de frontend (Next.js) para o painel de administração e para o painel do cliente.

## 1. Visão Geral

Os endpoints de consulta permitirão:
- Listar todos os pedidos, com opções de filtragem e paginação, para o painel de administração.
- Obter os detalhes de um pedido específico por ID, para o painel do cliente.

## 2. Estruturas de Dados (Baseadas em `backend-orders-api.md`)

As estruturas de dados para `Order`, `OrderItem` e `OrderItemDetails` serão as mesmas definidas no `backend-orders-api.md`.



## 3. Especificação da API

### Endpoint: `GET /v1/orders`

**Descrição:** Retorna uma lista paginada de todos os pedidos. Destinado ao painel de administração.

**Query Parameters:**
- `page`: `number` (Opcional) - Número da página (padrão: 1).
- `limit`: `number` (Opcional) - Quantidade de itens por página (padrão: 10).
- `paymentStatus`: `string` (Opcional) - Filtra pedidos por status de pagamento (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`).
- `userId`: `string` (Opcional) - Filtra pedidos por ID do usuário (para uso futuro, se necessário).

**Success Response (200 OK):**
```typescript
interface OrderListResponseDto {
  data: OrderDto[]; // Array de pedidos
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// OrderDto deve incluir os itens do pedido e seus detalhes
interface OrderDto {
  id: string;
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
  items: OrderItemDto[]; // Inclui os itens do pedido
}

interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM';
  itemPrice: number;
  createdAt: string;
  details: OrderItemDetailsDto[]; // Inclui os detalhes da seleção
}

interface OrderItemDetailsDto {
  id: string;
  orderItemId: string;
  photoId?: string;
  eventId?: string;
  isPackage?: boolean;
}
```

### Endpoint: `GET /v1/orders/{id}`

**Descrição:** Retorna os detalhes de um pedido específico pelo seu ID. Destinado ao painel do cliente (para "Meus Pedidos").

**Path Parameters:**
- `id`: `string` (Obrigatório) - O ID único do pedido.

**Success Response (200 OK):**
```typescript
// Retorna a mesma estrutura de OrderDto do endpoint de listagem
interface OrderDto {
  id: string;
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
  items: OrderItemDto[]; // Inclui os itens do pedido
}

interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM';
  itemPrice: number;
  createdAt: string;
  details: OrderItemDetailsDto[]; // Inclui os detalhes da seleção
}

interface OrderItemDetailsDto {
  id: string;
  orderItemId: string;
  photoId?: string;
  eventId?: string;
  isPackage?: boolean;
}
```