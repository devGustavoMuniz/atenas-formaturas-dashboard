import { api } from "./axios-config"
import type { Product } from "@/lib/types"
import type { Institution } from "./institutions-api"

export type InstitutionProduct = {
  id: string
  product: Product
  institution: Institution
  details: any;
  // ... outros campos que você possa precisar
}

/**
 * Busca os produtos que já estão configurados para uma instituição específica.
 */
export async function fetchInstitutionProducts(institutionId: string): Promise<InstitutionProduct[]> {
  const response = await api.get(`/v1/institution/products`, {
    params: { institutionId },
  })
  return response.data.data || []
}

/**
 * Vincula um único produto a uma instituição.
 */
export async function linkProductToInstitution(payload: { institutionId: string; productId: string }): Promise<void> {
  // Endpoint POST para criar um novo vínculo
  await api.post(`/v1/institution/products`, payload)
}

/**
 * Desvincula um produto de uma instituição.
 * @param institutionProductId - O ID do VÍNCULO (não o ID do produto).
 */
export async function unlinkProductFromInstitution(institutionProductId: string): Promise<void> {
  // Endpoint DELETE para remover o vínculo
  await api.delete(`/v1/institution/products/${institutionProductId}`)
}

export async function updateInstitutionProductDetails(institutionProductId: string, details: any): Promise<void> {
  // Assumindo um endpoint PATCH para atualizar os detalhes do vínculo
  await api.patch(`/v1/institution/products/${institutionProductId}`, { details });
}