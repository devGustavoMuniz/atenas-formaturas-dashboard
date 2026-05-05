// app/(dashboard)/products/page.tsx

import type { Metadata } from "next"
import { ProductsTable } from "@/components/products/products-table"
import { Package } from "lucide-react"

export const metadata: Metadata = {
    title: "Produtos",
    description: "Gerenciamento de produtos",
}

export default function ProductsPage() {
    return (
        <div className="relative overflow-hidden rounded-[1.5rem] border border-yellow-400/20 bg-zinc-950 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.20),transparent_54%)]" />
            <div className="relative flex flex-col gap-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-950 shadow-lg shadow-yellow-500/20">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-yellow-300">Catálogo</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Produtos</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                            Gerencie produtos, categorias e configurações base usadas nos contratos.
                        </p>
                    </div>
                </div>
                <ProductsTable />
            </div>
        </div>
    )
}
