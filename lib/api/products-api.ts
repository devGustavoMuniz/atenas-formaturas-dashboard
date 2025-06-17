// lib/api/products-api.ts

import { api } from "./axios-config"
import type { PaginationParams } from "./users-api"
import type { Product } from "@/lib/types"

// --- Início dos Dados Mockados ---

// --- ALTERAÇÃO AQUI ---
// Usando a URL completa e válida que você forneceu.
const mockVideoUrl = "https://ff38f93416df62983a9e98a3226b20d856a51a7c01802e9b8551fd5-apidata.googleusercontent.com/download/storage/v1/b/atenas-dev/o/WhatsApp%20Video%202025-06-02%20at%2018.11.57.mp4?jk=AXbWWmm4b_A32SK6xSdBax_d8Ts9iyZlQchinT7DBhqeOTKhfBVWL21Gw0JY8yA5YTQvePLSlu_LimXuTKSZ9p_j02jEx4YcmOc-i5OocyNO_o2wtSP_HKVi4eS1Q3dCZeqncHOpf_h8PskX-kTBD51ZZO7jGAjBYvAzJ9kQF2FL_42UA0zOpt9HM0J21_yn2QQN2dz7pwewdyxvalX0-UB-vIu9eS7UFxm1JIpnZYWcYWDubkFxDZI2C61bjLWSWvuIDAQpam3w4DzIRCG4fF4YhkrDdUGg8D7YShe-NxkLyc6tK0X4wU_riNtpLVhKMT9PR49J3lKUDT23R3JSCFd__sktwTYCmbEY8ChO7yDyVHTlZWC--NTSnUemEjnNAaixgLFtTZvOcjNm1zVxbwfvgPBkzcxIWsJICBxPkvmIEUBVSniZBM3BwX9bqBt3fHtx5rkSZ1SG3BtnbhEZOb44Gg5tJakQK9TRlrLriEyBOwytMrqByrs_BX9QGzQOc_KtweFEnrBgAu1i86Yyc-A_ZIvr7hh6kc4WuvK75-HaCwuBe--61tNECnP7CJ17nDwpn8sq9ZVLPETGbFTllQWuKCWqiqyN-5qy12v-mCRnu42xlZwSIfjxzDtZ2mktmnPld_ehldH-3Foq0OxYO1cC2Iv-ZwWPCaNm7xDTcb0eNI3sy98J4rktri-YOTExTNZZQb018NwCMd-BWnibXYUoyV7EOUlTs67WPPYd1Cd__eVVNIzE2OswTxfXhcfovqNGSDqMP_UTLDvaJQ3IBA-JimP4aIXSqsWbyvkht_axFiABxMbDbZZkkMVoH4Q2kGHhrOZjciq0o6OhgFA2e8LZIpwqZ2Stkz8pNreFajpBKn1MeUvjv37eazf4_scEO0gfuvQy6Ayu875kS3H1Se4xALgG9--qLmlxTuFUc9NaB4_mxB91lVRoUVOg2SaioPJJWHF0wginNIO-C7oxf94JfabQ-6VkC55dxzHE_CaNCwmsbrP4fkytEQS43ocbsI9mcR_v8sduXgcSdtvddJeekr6q6bk1SPOdoqiclYyTbmuA-AdPLwxPAbyqYJ8uoC0XqLRRS2PI70lMVEWlX_vcJrBtSnrmiYvhtWvish8PfNUwtc_V_uSlcliu_KTSL0NdlEO3WFYK2zp_bayIy8MFYSP8uWt81ENXSTpJ7H6VdsF-hgC2N-Dl2ib80nP9PxvL6UTIVmy_5mpwBe3xXFCR35Ot&isca=1";

const mockProducts: Product[] = [
    {
        id: "prod-1",
        name: "Álbum de Luxo 30x30",
        category: "Álbum",
        description: "Um álbum fotográfico de alta qualidade com capa de couro e 20 páginas.",
        photos: ["photo1.jpg", "photo2.jpg"],
        videos: [], // Este produto não tem vídeo
        createdAt: "2024-06-10T10:00:00Z",
    },
    {
        id: "prod-2",
        name: "Pacote de Fotos Digitais",
        category: "Arquivos digitais",
        description: "Todas as fotos do evento em alta resolução, entregues digitalmente.",
        photos: ["event_photo_1.jpg", "event_photo_2.jpg", "event_photo_3.jpg"],
        videos: [mockVideoUrl], // Usando a URL mockada
        createdAt: "2024-06-11T11:30:00Z",
    },
    {
        id: "prod-3",
        name: "Quadro com Foto Selecionada",
        category: "Produto com seleção de fotos",
        description: "Escolha sua foto favorita para ser impressa e emoldurada em um quadro de 50x70cm.",
        photos: ["frame_example.jpg"],
        videos: [], // Este produto não tem vídeo
        createdAt: "2024-06-12T14:00:00Z",
    },
]

// Simula o banco de dados
let dbProducts: Product[] = [...mockProducts]

const simulateDelay = (ms: number) => new Promise((res) => setTimeout(res, ms))

// --- Fim dos Dados Mockados ---

export async function fetchProducts(params: PaginationParams = {}): Promise<Product[]> {
    await simulateDelay(500)
    console.log("Fetching products with params:", params)

    const { search } = params
    if (search && search.trim() !== "") {
        return dbProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }

    return dbProducts
}

export async function fetchProductById(id: string): Promise<Product> {
    await simulateDelay(500)
    const product = dbProducts.find((p) => p.id === id)
    if (!product) throw new Error("Product not found")
    return product
}

export async function createProduct(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
    await simulateDelay(1000)
    const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        // --- ALTERAÇÃO AQUI ---
        // Adicionando um vídeo mockado para todo novo produto para fins de teste
        videos: [mockVideoUrl],
    }
    dbProducts.push(newProduct)
    return newProduct
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, "id">>): Promise<Product> {
    await simulateDelay(1000)
    let productToUpdate = dbProducts.find((p) => p.id === id)
    if (!productToUpdate) throw new Error("Product not found to update")

    productToUpdate = { ...productToUpdate, ...productData }
    dbProducts = dbProducts.map((p) => (p.id === id ? productToUpdate : p))

    return productToUpdate
}

export async function deleteProduct(id: string): Promise<void> {
    await simulateDelay(1000)
    const initialLength = dbProducts.length
    dbProducts = dbProducts.filter((p) => p.id !== id)
    if (dbProducts.length === initialLength) {
        throw new Error("Produto não encontrado para exclusão.")
    }
}

export async function getPresignedUrlsForProduct(count: number, types: string[]): Promise<{ uploadUrl: string; filename: string }[]> {
    await simulateDelay(700);

    const urls = [];
    for (let i = 0; i < count; i++) {
        const fileType = types[i] || 'application/octet-stream';
        const extension = fileType.split('/')[1] || 'tmp';
        const uniqueFilename = `product-media-${Date.now()}-${i}.${extension}`;

        // Para simular, vamos usar a mesma URL de vídeo funcional que já temos,
        // mas na vida real, cada URL seria única.
        const mockUploadUrl = `https://ff38f93416df62983a9e98a3226b20d856a51a7c01802e9b8551fd5-apidata.googleusercontent.com/upload/storage/v1/b/atenas-dev/o/${uniqueFilename}?jk=...&isca=1`;

        urls.push({
            uploadUrl: mockUploadUrl,
            filename: uniqueFilename,
        });
    }

    return urls;
}