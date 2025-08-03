# Especificação do Endpoint: Criar Preferência de Pagamento

**Finalidade:** Criar uma sessão de pagamento no Mercado Pago e retornar a URL para o checkout.

*   **Endpoint:** `POST /api/create-preference`
*   **Método:** `POST`

## Dados de Entrada (Request Body)

O endpoint deve esperar um objeto JSON com a seguinte estrutura:

```json
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "quantity": 1,
      "unit_price": "number"
    }
  ],
  "payer": {
    "name": "string",
    "surname": "string",
    "email": "string",
    "phone": {
      "area_code": "string",
      "number": "string"
    },
    "address": {
      "street_name": "string",
      "street_number": "string",
      "zip_code": "string"
    }
  }
}
```

## Dados de Saída (Response Body)

### Em caso de sucesso (HTTP 200)

O endpoint deve retornar um objeto JSON contendo o ID da preferência e a URL de checkout do Mercado Pago.

```json
{
  "id": "string",
  "checkoutUrl": "string"
}
```

### Em caso de erro (HTTP 500 ou outro código de erro apropriado)

O endpoint deve retornar um objeto JSON com uma mensagem de erro.

```json
{
  "error": "string"
}
```
