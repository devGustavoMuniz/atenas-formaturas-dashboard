// app/(dashboard)/products/new/page.tsx

import type { Metadata } from "next"
import { ProductForm } from "@/components/products/product-form"

export const metadata: Metadata = {
    title: "Novo Produto",
    description: "Adicionar novo produto",
}

export default function NewProductPage() {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Novo Produto</h2>
            <div className="space-y-4">
                <ProductForm />
            </div>
        </div>
    )
}