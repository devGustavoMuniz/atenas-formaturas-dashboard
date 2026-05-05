// components/products/product-table-toolbar.tsx

"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"

interface ProductTableToolbarProps {
    onSearchChange: (search: string) => void
}

export function ProductTableToolbar({ onSearchChange }: ProductTableToolbarProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        onSearchChange(value)
    }

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-center space-x-2 sm:w-auto">
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        type="search"
                        placeholder="Buscar produtos..."
                        className="h-10 w-full rounded-xl border-zinc-700 bg-zinc-900 pl-9 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-yellow-400 focus-visible:ring-yellow-400"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => router.push("/products/new")} className="h-10 rounded-xl bg-yellow-400 font-semibold text-zinc-950 shadow-lg shadow-yellow-500/20 hover:bg-yellow-300">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
            </Button>
        </div>
    )
}
