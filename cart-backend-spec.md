# Modulo de Carrinho — Especificacao Backend

## Contexto

O carrinho da aplicacao e 100% client-side (Zustand + localStorage). Isso causa problemas:

1. **Carrinho perdido apos pagamento**: O usuario paga no Mercado Pago, o webhook confirma, mas o carrinho so e limpo se o usuario voltar ao site e chegar na pagina de sucesso. Se ele fechar o navegador, o carrinho permanece com itens ja comprados.
2. **Desistencia no Mercado Pago**: O usuario vai para a tela do MP, desiste, e ao voltar o carrinho esta vazio (porque era limpo na criacao do pedido). Isso gera frustracao.
3. **Sem escopo por usuario**: Dois usuarios no mesmo navegador compartilham o mesmo carrinho.

## Solucao

Criar uma entidade `Cart` no backend vinculada ao usuario autenticado. O frontend passa a sincronizar o estado do carrinho via API. O backend limpa o carrinho quando o pagamento e aprovado (via webhook do Mercado Pago ou na criacao de pedidos gratuitos/credito).

---

## Entidade

### Cart

| Campo       | Tipo              | Descricao                                                      |
|-------------|-------------------|----------------------------------------------------------------|
| `id`        | UUID (PK)         | Identificador unico                                            |
| `userId`    | UUID (FK, UNIQUE) | Referencia ao usuario. Constraint unique — 1 carrinho por usuario |
| `items`     | JSONB             | Array de itens do carrinho (estrutura completa abaixo)         |
| `createdAt` | timestamp         | Data de criacao                                                |
| `updatedAt` | timestamp         | Atualizado a cada modificacao. Usado pelo cron de limpeza      |

A constraint `UNIQUE` no `userId` garante que cada usuario tenha no maximo um carrinho. As operacoes de upsert devem usar essa constraint.

---

## Estrutura do campo `items` (JSONB)

Cada item do array segue esta estrutura:

```json
{
  "id": "string (ID unico do item, gerado no frontend via timestamp)",
  "product": {
    "id": "string",
    "name": "string",
    "flag": "ALBUM | GENERIC | DIGITAL_FILES",
    "description": "string",
    "photos": ["string"],
    "video": ["string"] // opcional
  },
  "institutionProduct": {
    "id": "string",
    "product": { /* mesmo objeto Product acima */ },
    "institution": { /* objeto Institution */ },
    "details": {
      "events": [
        {
          "id": "string",
          "name": "string",
          "minPhotos": "number",
          "maxPhotos": "number",
          "valorPhoto": "number",
          "date": "string",
          "valorPack": "number"
        }
      ],
      "minPhoto": "number",
      "maxPhoto": "number",
      "valorEncadernacao": "number",
      "valorFoto": "number",
      "isAvailableUnit": "boolean",
      "valorPackTotal": "number"
    }
  },
  "selection": {
    "type": "ALBUM | GENERIC | DIGITAL_FILES_PACKAGE | DIGITAL_FILES_UNIT",
    "selectedPhotos": "string[] ou Record<string, string[]>",
    "selectedEvents": "string[]",
    "isPackageComplete": "boolean"
  },
  "totalPrice": "number",
  "quantity": "number"
}
```

O backend NAO precisa validar ou processar essa estrutura internamente. Ela e armazenada e retornada como JSONB opaco. A validacao de negocios acontece no `POST /v1/orders`, que ja existe.

---

## Endpoints

Todos os endpoints usam o token JWT do header `Authorization: Bearer <token>` para identificar o usuario. Nenhum endpoint recebe `userId` como parametro — ele e extraido do token.

### GET /v1/cart

Retorna o carrinho do usuario autenticado.

**Response 200:**
```json
{
  "items": [ /* array de CartItem */ ]
}
```

Se o usuario nao tiver carrinho, retornar `{ "items": [] }` (nao 404).

### PUT /v1/cart

Cria ou atualiza o carrinho do usuario (upsert). Substitui todos os itens.

**Request body:**
```json
{
  "items": [ /* array de CartItem */ ]
}
```

**Response 200:**
```json
{
  "items": [ /* array de CartItem salvo */ ]
}
```

Deve atualizar o campo `updatedAt` a cada chamada.

### DELETE /v1/cart

Limpa o carrinho do usuario (deleta a row ou seta `items = []`).

**Response 204:** Sem body.

Se o usuario nao tiver carrinho, retornar 204 (idempotente).

---

## Integracao com Pedidos

### Na criacao de pedido com pagamento FREE ou CREDIT

Quando o `POST /v1/orders` retorna `paymentMethod: 'FREE'` ou `paymentMethod: 'CREDIT'`, o pedido ja esta confirmado. O backend deve limpar o carrinho do usuario nesse momento.

Fluxo:
1. `POST /v1/orders` recebe os itens e cria o pedido
2. Backend determina que o pagamento e FREE/CREDIT
3. Backend limpa o carrinho do `userId` (mesmo efeito de `DELETE /v1/cart`)
4. Retorna a response com `paymentMethod: 'FREE' | 'CREDIT'`

### No webhook do Mercado Pago (pagamento aprovado)

Quando o backend recebe o webhook de pagamento aprovado do Mercado Pago e atualiza o pedido para `APPROVED`, deve tambem limpar o carrinho do `userId` associado ao pedido.

Fluxo:
1. Webhook do MP chega com `payment.status === 'approved'`
2. Backend atualiza o pedido para `paymentStatus: 'APPROVED'`
3. Backend busca o `userId` do pedido
4. Backend limpa o carrinho desse usuario (mesmo efeito de `DELETE /v1/cart`)

Isso garante que, independente de o usuario voltar ao site ou nao, o carrinho sera limpo quando o pagamento for confirmado.

---

## Cron Job — Limpeza de Carrinhos Abandonados

Para evitar acumulo de carrinhos abandonados no banco:

- **Frequencia**: Diaria (sugestao: 3h da manha)
- **Regra**: Deletar carrinhos onde `updatedAt < NOW() - INTERVAL '7 days'`
- **Query**: `DELETE FROM cart WHERE updated_at < NOW() - INTERVAL '7 days'`

---

## Fluxos Completos

### Usuario adiciona item ao carrinho
```
Frontend: addToCart() -> atualiza estado local -> PUT /v1/cart { items }
Backend: Upsert na tabela cart para o userId do token
```

### Usuario faz checkout com Mercado Pago
```
Frontend: POST /v1/orders -> recebe mercadoPagoCheckoutUrl
Frontend: Redireciona para Mercado Pago
(carrinho permanece intacto no backend)

Cenario A — Usuario paga:
  MP envia webhook -> Backend atualiza pedido para APPROVED
  Backend limpa carrinho do userId
  Usuario volta ao site -> GET /v1/cart retorna { items: [] }

Cenario B — Usuario desiste:
  Usuario volta ao site -> GET /v1/cart retorna carrinho intacto
  Usuario pode adicionar mais itens e tentar novamente
```

### Usuario faz checkout com credito/gratuito
```
Frontend: POST /v1/orders -> recebe paymentMethod: 'FREE' | 'CREDIT'
Backend: Cria pedido + limpa carrinho do userId
Frontend: Redireciona para pagina de confirmacao
Frontend: GET /v1/cart retorna { items: [] }
```

---

## Resumo de Mudancas no Backend

| Area       | Mudanca |
|------------|---------|
| Entidade   | Criar tabela `cart` com campos `id`, `userId` (unique), `items` (JSONB), `createdAt`, `updatedAt` |
| Endpoints  | `GET /v1/cart`, `PUT /v1/cart`, `DELETE /v1/cart` — todos autenticados |
| Orders     | No `POST /v1/orders`, limpar carrinho quando `paymentMethod` e FREE ou CREDIT |
| Webhook MP | Ao confirmar pagamento (APPROVED), limpar carrinho do userId do pedido |
| Cron       | Job diario para deletar carrinhos com `updatedAt > 7 dias` |
