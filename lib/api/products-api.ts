// lib/api/products-api.ts

import { api } from "./axios-config"
import type { PaginationParams } from "./users-api"
import type { Product } from "@/lib/types"

// ... (fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct continuam iguais) ...
export async function fetchProducts(params: PaginationParams = {}): Promise<Product[]> {
  const response = await api.get("/v1/products", { params })
  return response.data.data || []
}

export async function fetchProductById(id: string): Promise<Product> {
  const response = await api.get(`/v1/products/${id}`)
  return response.data
}

export async function createProduct(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const response = await api.post("/v1/products", productData)
  return response.data
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, "id">>): Promise<Product> {
  const response = await api.put(`/v1/products/${id}`, productData)
  return response.data
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/v1/products/${id}`)
}


// --- ALTERADO AQUI ---
/**
 * Obtém URLs de upload assinadas (presigned URLs) para lotes de arquivos.
 * O corpo da requisição segue o padrão: { contentType, quantity, mediaType, customIdentifier }
 */
export async function getPresignedUrlsForProduct(requests: { contentType: string; mediaType: 'image' | 'video'; customIdentifier: string }[]): Promise<{ uploadUrl: string; filename: string }[]> {

    const batchPromises = requests.map(request =>
        api.post("/v1/storage/presigned-url", {
            contentType: request.contentType,
            quantity: 1,
            mediaType: request.mediaType,
            customIdentifier: request.customIdentifier,
        })
    );

    const responses = await Promise.all(batchPromises);

    // Extrai e achata os arrays de 'urls' de cada objeto de resposta
    const allPresignedData = responses.flatMap(response => response.data.urls);

    return allPresignedData;
}