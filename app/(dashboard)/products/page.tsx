// app/(dashboard)/products/page.tsx

import type { Metadata } from "next"
import { ProductsTable } from "@/components/products/products-table"

export const metadata: Metadata = {
    title: "Produtos",
    description: "Gerenciamento de produtos",
}

export default function ProductsPage() {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
            <div className="space-y-4">
                <ProductsTable />
            </div>
        </div>
    )
}