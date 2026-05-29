# Planejamento - Dashboard V1

## Objetivo

Criar um modulo de dashboard administrativo com metricas reais para acompanhamento financeiro e operacional da plataforma.

Esta V1 deve substituir os dados mockados atuais do frontend e priorizar informacoes que ja fazem parte do dominio do sistema: pedidos, receita, status de producao, contratos/instituicoes e produtos vendidos.

## Escopo da V1

O dashboard deve responder principalmente:

- Quanto vendemos no periodo?
- Quantos pedidos foram criados no periodo?
- Quantos pedidos ainda exigem acao operacional?
- Quais produtos mais vendem?
- Quais contratos/instituicoes mais movimentam pedidos?
- Como esta o funil operacional dos itens comprados?

Ficam fora da V1:

- Metricas detalhadas de fotos.
- Metricas detalhadas de credito.
- Dashboards por cliente/formando.
- Graficos preditivos ou comparacoes avancadas.

## Filtros

O backend deve permitir filtrar o dashboard por periodo.

Filtros recomendados:

- `startDate`: data inicial no formato ISO.
- `endDate`: data final no formato ISO.
- `institutionId`: opcional, para filtrar por contrato/instituicao.

Caso o frontend nao envie periodo, o backend pode assumir o mes atual.

## Cards Principais

### Receita do periodo

Soma do valor dos pedidos pagos/concluidos no periodo.

Regras sugeridas:

- Considerar pedidos com `paymentStatus` igual a `APPROVED` ou `COMPLETED`.
- Nao considerar pedidos `PENDING`, `REJECTED` ou `CANCELLED`.
- Retornar tambem a variacao percentual em relacao ao periodo anterior equivalente.

### Pedidos do periodo

Total de pedidos criados no periodo.

Regras sugeridas:

- Contar todos os pedidos criados no periodo.
- Retornar tambem a variacao percentual em relacao ao periodo anterior equivalente.

### Pedidos pendentes

Quantidade de pedidos que ainda exigem resolucao.

Regras sugeridas:

- Considerar pedidos com `paymentStatus` igual a `PENDING`.
- Opcionalmente, incluir pedidos pagos que ainda tenham itens sem status final de producao/entrega.

### Formandos ativos

Total de usuarios client ativos.

Regras sugeridas:

- Considerar usuarios com `role = client`.
- Considerar somente `status = active`.
- Se houver filtro por instituicao, contar apenas formandos daquela instituicao.

## Grafico Principal

### Receita e pedidos por periodo

Serie temporal para exibir evolucao de vendas e volume de pedidos.

Granularidade recomendada:

- Periodos curtos: diario.
- Periodos maiores: mensal.

Dados esperados por ponto:

- Data ou mes.
- Receita aprovada/concluida.
- Quantidade de pedidos criados.

## Bloco Operacional

### Pedidos por status de pagamento

Distribuicao de pedidos por:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `COMPLETED`

### Itens por status de producao

Distribuicao de itens de pedido por:

- `ORDER_RECEIVED`
- `PHOTOS_SEPARATED`
- `PRODUCT_MANUFACTURED`
- `IN_TRANSIT`
- `DELIVERED`
- `SENT`

Essa metrica e importante porque um pedido pode conter mais de um item, e cada item pode estar em uma etapa diferente.

## Rankings

### Produtos mais vendidos

Ranking dos produtos mais vendidos no periodo.

Campos recomendados:

- `productId`
- `productName`
- `productType`
- Quantidade vendida.
- Receita gerada.

Regras sugeridas:

- Considerar apenas pedidos aprovados/concluidos.
- Ordenar por receita ou quantidade. O frontend pode alternar futuramente, mas a V1 pode retornar ordenado por receita.

### Contratos com mais pedidos

Ranking de contratos/instituicoes com maior volume no periodo.

Campos recomendados:

- `institutionId`
- `institutionName`
- `contractNumber`
- Quantidade de pedidos.
- Receita gerada.
- Quantidade de formandos ativos, se disponivel.

Regras sugeridas:

- Considerar apenas pedidos do periodo.
- Para receita, considerar apenas pedidos aprovados/concluidos.

## Pedidos Recentes

Lista curta para substituir o bloco atual de usuarios recentes.

Campos recomendados:

- `id`
- `displayId`
- `userId`
- `userName`
- `institutionId`
- `institutionName`
- `contractNumber`
- `totalAmount`
- `paymentStatus`
- `createdAt`

Regras sugeridas:

- Retornar os ultimos 5 a 10 pedidos.
- Respeitar filtro de instituicao, se informado.

## Endpoint Recomendado

### `GET /v1/dashboard/admin`

Query params:

```txt
startDate=2026-05-01
endDate=2026-05-31
institutionId=optional
```

Resposta sugerida:

```json
{
  "period": {
    "startDate": "2026-05-01",
    "endDate": "2026-05-31",
    "previousStartDate": "2026-04-01",
    "previousEndDate": "2026-04-30"
  },
  "summary": {
    "revenue": {
      "value": 125000,
      "variationPercent": 12.5
    },
    "orders": {
      "value": 340,
      "variationPercent": 8.2
    },
    "pendingOrders": {
      "value": 26,
      "variationPercent": -4.1
    },
    "activeStudents": {
      "value": 1840,
      "variationPercent": 3.4
    }
  },
  "revenueSeries": [
    {
      "date": "2026-05-01",
      "revenue": 4200,
      "orders": 12
    }
  ],
  "ordersByPaymentStatus": [
    {
      "status": "APPROVED",
      "count": 210
    }
  ],
  "itemsByFulfillmentStatus": [
    {
      "status": "ORDER_RECEIVED",
      "count": 78
    }
  ],
  "topProducts": [
    {
      "productId": "product-id",
      "productName": "Album",
      "productType": "ALBUM",
      "quantitySold": 80,
      "revenue": 32000
    }
  ],
  "topInstitutions": [
    {
      "institutionId": "institution-id",
      "institutionName": "Turma Medicina 2026",
      "contractNumber": "2026-001",
      "orders": 42,
      "revenue": 18000,
      "activeStudents": 120
    }
  ],
  "recentOrders": [
    {
      "id": "order-id",
      "displayId": "PED-001",
      "userId": "user-id",
      "userName": "Maria Silva",
      "institutionId": "institution-id",
      "institutionName": "Turma Medicina 2026",
      "contractNumber": "2026-001",
      "totalAmount": 450,
      "paymentStatus": "APPROVED",
      "createdAt": "2026-05-05T10:00:00.000Z"
    }
  ]
}
```

## Observacoes de Implementacao

- Valores monetarios devem ser retornados em numero, preferencialmente em reais como decimal ou em centavos de forma padronizada. O frontend precisa saber qual padrao sera usado.
- Status devem seguir exatamente os enums ja usados nos pedidos.
- O endpoint deve ser protegido para usuarios admin.
- O frontend atual nao usa middleware do Next para auth; a autorizacao real deve continuar sendo responsabilidade do backend.
- Se algum dado nao estiver disponivel na primeira entrega, retornar arrays vazios e valores zerados, evitando mocks.

## Criterios de Aceite

- O endpoint retorna dados reais, sem mocks.
- O dashboard consegue carregar com periodo padrao de mes atual.
- O dashboard permite filtrar por periodo.
- O dashboard permite filtrar por instituicao, se `institutionId` for enviado.
- Os cards principais batem com os mesmos pedidos usados nas listagens administrativas.
- Pedidos cancelados/rejeitados nao entram na receita.
- Pedidos recentes retornam dados suficientes para o frontend criar link para o detalhe do pedido.
