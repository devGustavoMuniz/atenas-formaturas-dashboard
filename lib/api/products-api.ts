// lib/api/products-api.ts

import { api } from "./axios-config"
import type { PaginationParams } from "./users-api"
import type { Product } from "@/lib/types"

// ... (fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct continuam iguais) ...
export async function fetchProducts(params: PaginationParams = {}): Promise<Product[]> {
  console.log("Buscando produtos reais com os parâmetros:", params)
  const response = await api.get("/v2/products", { params })
  return response.data.data || []
}

export async function fetchProductById(id: string): Promise<Product> {
  console.log(`Buscando produto real com ID: ${id}`)
  const response = await api.get(`/v2/products/${id}`)
  return response.data
}

export async function createProduct(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
  console.log("Criando novo produto real com os dados:", productData)
  const response = await api.post("/v2/products", productData)
  return response.data
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, "id">>): Promise<Product> {
  console.log(`Atualizando produto real ${id} com os dados:`, productData)
  const response = await api.put(`/v2/products/${id}`, productData)
  return response.data
}

export async function deleteProduct(id: string): Promise<void> {
  console.log(`Excluindo produto real com ID: ${id}`)
  await api.delete(`/v2/products/${id}`)
}


// --- ALTERADO AQUI ---
/**
 * Obtém URLs de upload assinadas (presigned URLs) para lotes de arquivos.
 * O corpo da requisição segue o padrão: { contentType, quantity, mediaType }
 */
export async function getPresignedUrlsForProduct(requests: { contentType: string; quantity: number; mediaType: 'image' | 'video' }[]): Promise<{ uploadUrl: string; filename: string }[]> {
    console.log(`Obtendo URLs assinadas para os seguintes lotes:`, requests)

    const batchPromises = requests.map(request =>
        api.post("/v2/storage/presigned-url", request)
    );

    const responses = await Promise.all(batchPromises);

    // Extrai e achata os arrays de 'urls' de cada objeto de resposta
    const allPresignedData = responses.flatMap(response => response.data.urls);

    console.log("Todas as URLs assinadas recebidas e processadas:", allPresignedData);
    return allPresignedData;
}