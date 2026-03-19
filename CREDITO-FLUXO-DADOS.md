# 📊 Fluxo de Dados do Crédito do Usuário

## 🔄 Resumo do Fluxo

```
Backend API → AuthProvider → Zustand Store → UserCredit Component
```

---

## 📍 Endpoints e Dados

### 1. **Endpoint Principal: GET /v1/users/:id**

**Arquivo:** `lib/api/users-api.ts` (linha 92-95)

```typescript
export async function fetchUserById(id: string): Promise<User> {
  const response = await api.get(`/v1/users/${id}`)
  return response.data
}
```

**URL Completa:** `https://atenas-backend-v2-stg.up.railway.app/v1/users/:id`

---

### 2. **Estrutura do User (Data Type)**

**Arquivo:** `lib/api/users-api.ts` (linha 26)

```typescript
export type User = {
  id: string
  name: string
  email: string
  // ... outros campos
  creditValue?: number  // ← ESTE É O CAMPO DO CRÉDITO
  // ... outros campos
}
```

---

### 3. **Quando é Atualizado?**

**Arquivo:** `lib/auth/auth-provider.tsx`

#### **Situação 1: Login**
```typescript
// Linha 105
const fullUser = await fetchUserById(userData.id)
setUser(fullUser)
setZustandUser(fullUser)  // Atualiza Zustand
```

#### **Situação 2: Refresh Token (ao carregar a página)**
```typescript
// Linha 55
const fullUser = await fetchUserById(user.id)
setUser(fullUser)
setZustandUser(fullUser)  // Atualiza Zustand
```

#### **Situação 3: Update Manual**
```typescript
// Linha 149-151
const updateUser = (updatedUser: User) => {
  setUser(updatedUser)
  setZustandUser(updatedUser)  // Atualiza Zustand
}
```

---

## 🎯 O Problema: Backend NÃO está diferenciando os créditos

### **Status Atual:**

❌ **Backend retorna apenas:** `creditValue: 500.00`  
❌ **NÃO retorna:** `reservedCredit` ou `availableCredit`

### **Como o Frontend está calculando:**

✅ **Frontend calcula LOCALMENTE:**
```typescript
// components/dashboard/user-credit.tsx
const totalCredit = user.creditValue ?? 0  // Do backend
const cartTotal = items.reduce(...)        // Calculado localmente
const reservedCredit = Math.min(totalCredit, cartTotal)  // Calculado
const availableCredit = totalCredit - reservedCredit     // Calculado
```

---

## 📝 O que você precisa confirmar com o Backend

### ❓ **Pergunta para o Backend:**

> "O endpoint `GET /v1/users/:id` está retornando o **crédito total** ou o **crédito disponível** (já descontando reservas de pedidos pendentes)?"

### 📋 **Cenários Possíveis:**

#### **Cenário A: Backend retorna crédito TOTAL (atual)**
```json
{
  "id": "user-123",
  "name": "João Silva",
  "creditValue": 500.00  // ← Crédito TOTAL (sem desconto)
}
```
✅ **Frontend está correto** - Calcula reserva localmente baseado no carrinho

---

#### **Cenário B: Backend retorna crédito DISPONÍVEL**
```json
{
  "id": "user-123",
  "name": "João Silva",
  "creditValue": 300.00  // ← Já descontado de pedidos pendentes
}
```
❌ **Problema:** Frontend está calculando reserva sobre um valor já reduzido!

---

#### **Cenário C: Backend retorna ambos (IDEAL)** ⭐
```json
{
  "id": "user-123",
  "name": "João Silva",
  "creditValue": 500.00,        // Crédito total
  "availableCredit": 300.00,    // Disponível (após reservas)
  "reservedCredit": 200.00      // Em pedidos pendentes
}
```
✅ **Melhor opção** - Frontend não precisa calcular

---

## 🔍 Como Verificar

### **Teste Recomendado:**

1. **Criar um pedido que entra em pagamento pendente no MP**
2. **Verificar resposta de `GET /v1/users/:id`**
3. **Comparar o `creditValue` antes e depois**

#### **Comportamento Esperado:**

| Momento | creditValue Deveria Ser |
|---------|-------------------------|
| Antes do pedido | R$ 500,00 (total) |
| Pedido pendente (MP) | R$ 500,00 (ainda total) |
| Pedido confirmado | R$ 300,00 (descontado) |
| Pedido cancelado | R$ 500,00 (devolvido) |

---

## 🚨 **Situação Atual do Frontend**

### **O que está acontecendo:**

1. ✅ **UserCredit Component** calcula reserva do **carrinho local**
2. ❌ **NÃO considera** pedidos pendentes no Mercado Pago
3. ❌ **NÃO atualiza** quando pedido é criado mas não pago

### **Exemplo do Problema:**

```
Usuário tem: R$ 500,00
1. Cria pedido de R$ 200,00 → Vai para MP
2. Abandona o MP (pedido fica pendente)
3. Volta ao site
4. Frontend mostra: R$ 500,00 disponível ❌

CORRETO seria: R$ 300,00 disponível
(porque R$ 200,00 estão reservados no pedido pendente)
```

---

## ✅ **Solução Recomendada**

### **Opção 1: Backend retornar campos separados** (MELHOR)

```typescript
// Atualizar tipo User em lib/types.ts
export type User = {
  // ...campos existentes
  creditValue: number           // Crédito total
  availableCredit?: number      // Crédito disponível (novo)
  reservedCredit?: number       // Crédito reservado (novo)
}
```

**Endpoint deve retornar:**
```json
{
  "creditValue": 500.00,
  "availableCredit": 300.00,
  "reservedCredit": 200.00
}
```

---

### **Opção 2: Novo endpoint específico** (ALTERNATIVA)

```
GET /v1/users/:id/credit-info
```

**Retorna:**
```json
{
  "total": 500.00,
  "available": 300.00,
  "reserved": 200.00,
  "reservations": [
    {
      "orderId": "ord-123",
      "amount": 200.00,
      "status": "PENDING"
    }
  ]
}
```

---

## 📞 **Perguntas para o Backend:**

1. ✅ **O `creditValue` atual é o total ou o disponível?**
2. ✅ **Pedidos pendentes reservam crédito no backend?**
3. ✅ **Se sim, essa reserva já está refletida no `creditValue`?**
4. ✅ **Podemos adicionar campos `availableCredit` e `reservedCredit`?**
5. ✅ **Quando o crédito é efetivamente descontado?**
   - Na criação do pedido?
   - Na confirmação do pagamento?
   - Outro momento?

---

## 🎯 **Ação Imediata:**

1. **Testar o endpoint atual:**
   ```bash
   curl -H "Authorization: Bearer {token}" \
     https://atenas-backend-v2-stg.up.railway.app/v1/users/{userId}
   ```

2. **Verificar se `creditValue` muda:**
   - Após criar pedido pendente
   - Após confirmar pagamento
   - Após cancelar pedido

3. **Confirmar com backend se precisam adicionar novos campos**

---

**Status:** ⚠️ **AGUARDANDO CONFIRMAÇÃO DO BACKEND**
