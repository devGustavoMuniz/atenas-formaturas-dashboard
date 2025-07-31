import { api } from "./axios-config"
import type { Product } from "@/lib/types"
import type { Institution } from "./institutions-api"
import { EventConfiguration } from "@/lib/product-details-types"

export interface InstitutionProductDetails {
  events?: EventConfiguration[]
  minPhoto?: number
  maxPhoto?: number
  valorEncadernacao?: number
  valorFoto?: number
}

export type InstitutionProduct = {
  id: string
  product: Product
  institution: Institution
  details: InstitutionProductDetails | null
}

/**
 * Busca os produtos que já estão configurados para um contrato específico.
 */
export async function fetchInstitutionProducts(institutionId: string): Promise<InstitutionProduct[]> {
  const response = await api.get(`/v1/institution/products`, {
    params: { institutionId },
  })
  return response.data.data || []
}

/**
 * Vincula um único produto a um contrato.
 */
export async function linkProductToInstitution(payload: { institutionId: string; productId: string }): Promise<void> {
  // Endpoint POST para criar um novo vínculo
  await api.post(`/v1/institution/products`, payload)
}

/**
 * Desvincula um produto de um contrato.
 * @param institutionProductId - O ID do VÍNCULO (não o ID do produto).
 */
export async function unlinkProductFromInstitution(institutionProductId: string): Promise<void> {
  // Endpoint DELETE para remover o vínculo
  await api.delete(`/v1/institution/products/${institutionProductId}`)
}

export async function updateInstitutionProductDetails(
  institutionProductId: string,
  details: InstitutionProductDetails
): Promise<void> {
  // Assumindo um endpoint PATCH para atualizar os detalhes do vínculo
  await api.patch(`/v1/institution/products/${institutionProductId}`, { details })
}
