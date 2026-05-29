# Relatório de Venda do Pedido - Requisitos para Backend

## Objetivo

Permitir que o frontend gere um PDF de relatório de venda a partir do sheet de detalhes do pedido em `/orders`.

O relatório precisa seguir o modelo operacional usado pela Atenas Formaturas, contendo dados da venda, comprador/formando, valores, forma de pagamento, itens comprados e dados de entrega.

## Situação atual

O frontend já recebe boa parte dos dados pelo endpoint:

```http
GET /v1/orders/:id
```

Porém alguns dados necessários para o relatório não vêm hoje no `OrderDto`, principalmente:

- dados reais do comprador usados no pagamento;
- CPF/documento do comprador;
- método de pagamento;
- quantidade de parcelas;
- taxas do Mercado Pago;
- valor líquido recebido.

Além disso, no Checkout Pro, os dados finais do pagamento não devem ser inferidos apenas pelo frontend. O backend deve consultar o pagamento no Mercado Pago e persistir um snapshot no pedido.

## Dados que o frontend já possui hoje

Estes campos já existem no pedido atual:

```ts
type OrderDto = {
  id: string
  displayId: string
  userId: string
  totalAmount: number
  paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  paymentGatewayId?: string
  contractNumber: string
  creditUsed?: number
  shippingAddress?: {
    zipCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  } | null
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    productId: string
    productName: string
    productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM'
    itemPrice: number
    quantity: number
    details: Array<{
      photoUrl?: string
      photoName?: string
      eventId?: string
      eventName?: string
      isPackage?: boolean
    }>
  }>
}
```

Com isso já conseguimos preencher:

- data da venda: `createdAt`;
- contrato: `contractNumber`;
- valor do pedido: `totalAmount`;
- créditos Atenas usados: `creditUsed`;
- itens do pedido: `items`;
- dados de entrega: `shippingAddress`.

## Dados que precisam ser adicionados ao pedido

Recomendação: adicionar ao retorno de `GET /v1/orders/:id` um objeto `report`.

```ts
type OrderReportDto = {
  saleDate: string

  contractNumber: string

  student: {
    name: string
  }

  buyer: {
    name: string
    cpf?: string | null
    email?: string | null
    phone?: string | null
  }

  amounts: {
    orderAmount: number
    atenasCreditUsed: number
    mercadoPagoFee?: number | null
    netReceivedAmount?: number | null
    totalPaidAmount?: number | null
  }

  payment: {
    provider: 'MERCADO_PAGO' | 'CREDIT' | 'FREE' | 'UNKNOWN'
    status: string
    methodId?: string | null
    methodType?: string | null
    installments?: number | null
    installmentAmount?: number | null
    description: string
  }

  delivery?: {
    zipCode: string
    street: string
    number: string
    complement?: string | null
    neighborhood: string
    city: string
    state: string
    phone?: string | null
    email?: string | null
  } | null
}
```

Exemplo no `OrderDto`:

```ts
type OrderDto = {
  id: string
  displayId: string
  // demais campos atuais...
  report?: OrderReportDto
}
```

## Origem recomendada dos dados

### Dados internos

Devem vir da base da aplicação:

- `saleDate`: `order.createdAt`;
- `contractNumber`: `order.contractNumber`;
- `student.name`: usuário vinculado ao pedido;
- `amounts.orderAmount`: `order.totalAmount`;
- `amounts.atenasCreditUsed`: `order.creditUsed ?? 0`;
- `delivery`: endereço salvo no pedido;
- `items`: continuar usando `order.items`.

### Dados do checkout/frontend enviados na criação do pedido

Hoje o frontend já envia `payer` no payload de criação:

```ts
type CreateOrderPayload = {
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
```

Esses dados são montados automaticamente:

- `firstName` e `lastName`: a partir de `user.name`;
- `email`: `user.email`;
- `phone`: telefone informado no checkout, pré-preenchido com `user.phone`.

Recomendação: persistir esse snapshot no pedido, pois o telefone/e-mail do usuário podem mudar depois.

Campos derivados:

- `buyer.name`: `${payer.firstName} ${payer.lastName}`;
- `buyer.email`: `payer.email`;
- `buyer.phone`: `payer.phone.areaCode + payer.phone.number`;
- `delivery.phone`: mesmo telefone usado no checkout, se fizer sentido para operação.

### Dados do Mercado Pago

No Checkout Pro, o webhook de pagamento envia principalmente o evento e o ID do pagamento.

Exemplo conceitual do webhook:

```json
{
  "action": "payment.updated",
  "type": "payment",
  "data": {
    "id": "123456"
  }
}
```

Com `data.id`, o backend deve consultar:

```http
GET https://api.mercadopago.com/v1/payments/{id}
Authorization: Bearer <ACCESS_TOKEN>
```

Documentação oficial:

- Webhooks Checkout Pro: https://www.mercadopago.com.br/developers/en/docs/checkout-pro/payment-notifications
- Obter pagamento: https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro/get-payment/get

Campos úteis do retorno do Mercado Pago:

```ts
type MercadoPagoPayment = {
  id: number
  status: string
  status_detail: string
  payment_method_id: string
  payment_type_id: string
  installments: number
  transaction_amount: number | string
  payer?: {
    email?: string | null
    identification?: {
      type?: string | null
      number?: string | null
    }
  }
  transaction_details?: {
    net_received_amount?: number
    total_paid_amount?: number | string
    installment_amount?: number
  }
}
```

Mapeamento recomendado:

- `buyer.cpf`: `payer.identification.number`, quando `payer.identification.type === 'CPF'`;
- `buyer.email`: preferir `payer.email` do Mercado Pago se disponível, senão usar snapshot do checkout;
- `payment.methodId`: `payment_method_id`;
- `payment.methodType`: `payment_type_id`;
- `payment.installments`: `installments`;
- `payment.installmentAmount`: `transaction_details.installment_amount`;
- `amounts.totalPaidAmount`: `transaction_details.total_paid_amount`;
- `amounts.netReceivedAmount`: `transaction_details.net_received_amount`;
- `amounts.mercadoPagoFee`: diferença entre valor pago e valor líquido recebido, se aplicável.

Sugestão para taxa:

```ts
mercadoPagoFee = totalPaidAmount - netReceivedAmount
```

Observação: validar essa regra com dados reais, pois pode haver juros, cupom, estorno parcial, split ou outras variações.

## Descrição da forma de pagamento

O backend pode retornar uma descrição pronta para exibição no relatório:

```ts
payment.description
```

Exemplos:

- `5x cartão de crédito`;
- `Pix`;
- `Boleto`;
- `Crédito Atenas`;
- `Gratuito`;
- `Mercado Pago`;
- `Pendente`.

Regras sugeridas:

- Se pagamento foi feito somente com crédito interno: `Crédito Atenas`;
- Se `payment_type_id === 'credit_card'`: `${installments}x cartão de crédito`;
- Se `payment_type_id === 'debit_card'`: `Cartão de débito`;
- Se `payment_method_id === 'pix'` ou `payment_type_id === 'bank_transfer'`: `Pix`;
- Se `payment_type_id === 'ticket'`: `Boleto`;
- Caso contrário: `Mercado Pago`.

## Exemplo de resposta ideal

```json
{
  "id": "order-id",
  "displayId": "250-001",
  "userId": "user-id",
  "totalAmount": 1000,
  "paymentStatus": "APPROVED",
  "contractNumber": "2520-001",
  "creditUsed": 250,
  "createdAt": "2026-03-03T10:00:00.000Z",
  "shippingAddress": {
    "zipCode": "37552-007",
    "street": "Rua Londrina",
    "number": "210",
    "neighborhood": "Jardim Canadá",
    "city": "Pouso Alegre",
    "state": "MG"
  },
  "items": [],
  "report": {
    "saleDate": "2026-03-03T10:00:00.000Z",
    "contractNumber": "2520-001",
    "student": {
      "name": "Angelica Pereira Lopes"
    },
    "buyer": {
      "name": "Luana Lopes Alves",
      "cpf": "67885623498",
      "email": "angelica.lopes.pereira@gmail.com",
      "phone": "35999289992"
    },
    "amounts": {
      "orderAmount": 1000,
      "atenasCreditUsed": 250,
      "mercadoPagoFee": 69.8,
      "netReceivedAmount": 680.2,
      "totalPaidAmount": 750
    },
    "payment": {
      "provider": "MERCADO_PAGO",
      "status": "approved",
      "methodId": "visa",
      "methodType": "credit_card",
      "installments": 5,
      "installmentAmount": 150,
      "description": "5x cartão de crédito"
    },
    "delivery": {
      "zipCode": "37552-007",
      "street": "Rua Londrina",
      "number": "210",
      "neighborhood": "Jardim Canadá",
      "city": "Pouso Alegre",
      "state": "MG",
      "phone": "35999289992",
      "email": "angelica.lopes.pereira@gmail.com"
    }
  }
}
```

## Observações importantes

- Não depender de consulta ao Mercado Pago no momento em que o frontend gerar o PDF.
- Persistir um snapshot dos dados de pagamento quando o webhook for processado.
- Manter os dados do relatório estáveis, mesmo que o cadastro do usuário seja alterado depois.
- Para pedidos antigos sem snapshot, o backend pode retornar `report` parcialmente preenchido e o frontend exibirá fallback para campos ausentes.
- Para pedidos com status pendente, os campos de pagamento do Mercado Pago podem estar incompletos ou ausentes.
