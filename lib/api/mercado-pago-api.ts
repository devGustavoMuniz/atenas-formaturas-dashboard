import { api } from './axios-config';
import { CartItem } from '../cart-types';

interface Payer {
  name: string;
  surname: string;
  email: string;
  phone: {
    area_code: string;
    number: string;
  };
  address: {
    street_name: string;
    street_number: string;
    zip_code: string;
  };
}

interface PreferencePayload {
  items: {
    id: string;
    title: string;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  payer: Payer;
}

interface PreferenceResponse {
  id: string;
  checkoutUrl: string;
}

export const createPaymentPreference = async (
  payload: PreferencePayload
): Promise<PreferenceResponse> => {
  const { data } = await api.post<PreferenceResponse>('/v1/mercado-pago/create-preference', payload);
  return data;
};