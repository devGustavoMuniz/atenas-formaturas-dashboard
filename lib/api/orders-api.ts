import { api } from '@/lib/api/axios-config'

// TODO: Substituir pela interface real quando o backend estiver pronto
export interface Order {
  id: string
  customerName: string
  totalAmount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

// Função para buscar os pedidos da API
// Por enquanto, retorna dados mocados
export const getOrders = async (): Promise<Order[]> => {
  console.log('Buscando pedidos da API...')
  // Simula uma chamada de API com um pequeno atraso
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Dados mocados
  const mockOrders: Order[] = [
    {
      id: 'order-123',
      customerName: 'João da Silva',
      totalAmount: 150.75,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'order-456',
      customerName: 'Maria Oliveira',
      totalAmount: 250.0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'order-789',
      customerName: 'Pedro Martins',
      totalAmount: 99.9,
      status: 'REJECTED',
      createdAt: new Date().toISOString(),
    },
  ]

  // Quando o backend estiver pronto, a chamada real será algo como:
  // const { data } = await api.get('/v1/orders')
  // return data

  return mockOrders
}
