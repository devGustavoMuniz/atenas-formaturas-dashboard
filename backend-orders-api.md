# Especificação Técnica: API de Pedidos e Pagamentos

Este documento detalha os requisitos para a criação e gerenciamento de pedidos no backend (NestJS), que servirá ao dashboard de frontend (Next.js).

## 1. Visão Geral do Fluxo

O objetivo é salvar um pedido no banco de dados com status "PENDENTE" *antes* de redirecionar o usuário para o gateway de pagamento.

1.  O usuário clica em "Finalizar Compra" no frontend.
2.  O frontend envia uma requisição para um **novo endpoint `POST /v1/orders`**.
3.  O backend:
    a. Valida os dados recebidos.
    b. Cria as entradas correspondentes nas novas tabelas (`orders`, `order_items`, `order_item_details`) com um status de pagamento inicial (`PENDING`).
    c. Chama o serviço do Mercado Pago para criar uma preferência de pagamento, associando o `orderId` gerado internamente.
    d. Responde ao frontend com o ID do pedido e a URL de checkout do Mercado Pago.
4.  O frontend redireciona o usuário para a URL de pagamento.
5.  O backend deve ter um **webhook** para receber atualizações de status do Mercado Pago e atualizar o campo `paymentStatus` na tabela `orders`.

## 2. Novas Tabelas no Banco de Dados

### Tabela: `orders`
Armazena a informação geral de cada pedido.

| Nome da Coluna     | Tipo de Dado | Descrição                                                              |
| :----------------- | :----------- | :--------------------------------------------------------------------- |
| `id`               | UUID         | Chave primária, identificador único do pedido.                         |
| `userId`           | UUID         | Chave estrangeira para a tabela `users`. Quem fez o pedido.            |
| `totalAmount`      | DECIMAL      | Valor total final do pedido.                                           |
| `paymentStatus`    | ENUM         | Status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.                |
| `paymentGatewayId` | VARCHAR      | ID da preferência/pagamento gerado pelo Mercado Pago.                  |
| `shippingAddress`  | JSONB        | Objeto JSON com os dados de entrega (CEP, rua, número, etc.).          |
| `createdAt`        | TIMESTAMP    | Data e hora da criação do pedido.                                      |
| `updatedAt`        | TIMESTAMP    | Data e hora da última atualização.                                     |

### Tabela: `order_items`
Armazena cada produto que faz parte de um pedido.

| Nome da Coluna  | Tipo de Dado | Descrição                                                      |
| :-------------- | :----------- | :------------------------------------------------------------- |
| `id`            | UUID         | Chave primária do item do pedido.                              |
| `orderId`       | UUID         | Chave estrangeira para a tabela `orders`.                      |
| `productId`     | UUID         | Chave estrangeira para a tabela `products`. O produto comprado.|
| `productName`   | VARCHAR      | Nome do produto no momento da compra (denormalizado).          |
| `productType`   | ENUM         | Flag do produto: `GENERIC`, `DIGITAL_FILES`, `ALBUM`.          |
| `itemPrice`     | DECIMAL      | Preço total deste item específico no pedido.                   |
| `createdAt`     | TIMESTAMP    | Data e hora da criação.                                        |

### Tabela: `order_item_details`
Armazena os detalhes da seleção de cada item (fotos, pacotes, etc.).

| Nome da Coluna  | Tipo de Dado | Descrição                                                          |
| :-------------- | :----------- | :----------------------------------------------------------------- |
| `id`            | UUID         | Chave primária.                                                    |
| `orderItemId`   | UUID         | Chave estrangeira para a tabela `order_items`.                     |
| `photoId`       | UUID         | (Opcional) Chave estrangeira para a tabela `photos`.               |
| `eventId`       | UUID         | (Opcional) ID do evento ao qual a foto/pacote pertence.            |
| `isPackage`     | BOOLEAN      | (Opcional) `true` se a seleção foi de um pacote (`DIGITAL_FILES`). |

## 3. Especificação da API

### Endpoint: `POST /v1/orders`

**Descrição:** Cria um novo pedido e a preferência de pagamento associada.

**Request Payload:**
```typescript
interface CreateOrderDto {
  cartItems: CartItemDto[];
  shippingDetails: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  payer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: {
      areaCode: string;
      number: string;
    };
  };
}

interface CartItemDto {
  productId: string;
  productName: string;
  productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM';
  totalPrice: number;
  selectionDetails: {
    // Para GENERIC e DIGITAL_FILES (unitário)
    photos?: Array<{
      id: string;
      eventId: string;
    }>;
    // Para DIGITAL_FILES (pacote)
    events?: Array<{
      id: string;
      isPackage: boolean;
    }>;
    isFullPackage?: boolean;
    // Para ALBUM
    albumPhotos?: string[]; // array de photoIds
  };
}
```

**Success Response (201 Created):**
```typescript
interface CreateOrderResponseDto {
  orderId: string; // O ID do pedido criado no nosso banco
  mercadoPagoCheckoutUrl: string; // A URL para redirecionar o cliente
}
```

## 4. Webhook do Mercado Pago

É necessário implementar um webhook para receber as notificações de pagamento do Mercado Pago. Este webhook deve:
1.  Identificar o pedido no banco de dados (provavelmente através do `external_reference` que será o nosso `orderId`).
2.  Atualizar o campo `paymentStatus` na tabela `orders` com o status recebido (`approved`, `rejected`, etc.).
