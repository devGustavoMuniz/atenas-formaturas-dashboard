// app/(dashboard)/products/[id]/edit/page.tsx

import type { Metadata } from "next"
import { ProductForm } from "@/components/products/product-form"

export const metadata: Metadata = {
    title: "Editar Produto",
    description: "Editar produto existente",
}

export default function EditProductPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Editar Produto</h2>
            <div className="space-y-4">
                <ProductForm productId={params.id} />
            </div>
        </div>
    )
}