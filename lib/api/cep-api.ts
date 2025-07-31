"use client"

import axios from "axios"

export interface ViaCEPAddress {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

/**
 * Busca um endereço a partir de um CEP na API ViaCEP.
 * @param cep - O CEP a ser consultado (somente números).
 * @returns Os dados do endereço ou null se não for encontrado.
 */
export const getAddressByCEP = async (cep: string): Promise<ViaCEPAddress | null> => {
  try {
    const response = await axios.get<ViaCEPAddress>(`https://viacep.com.br/ws/${cep}/json/`)
    if (response.data.erro) {
      return null
    }
    return response.data
  } catch (error) {
    console.error("Erro ao buscar CEP:", error)
    return null
  }
}
