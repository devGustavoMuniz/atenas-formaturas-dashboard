import { api } from './axios-config'
import type { CartItem } from '../cart-types'

type CartResponse = {
  items: CartItem[]
}

export const getCart = async (): Promise<CartResponse> => {
  const { data } = await api.get<CartResponse>('/v1/cart')
  return data
}

export const syncCart = async (items: CartItem[]): Promise<CartResponse> => {
  const { data } = await api.put<CartResponse>('/v1/cart', { items })
  return data
}

export const deleteCart = async (): Promise<void> => {
  await api.delete('/v1/cart')
}
