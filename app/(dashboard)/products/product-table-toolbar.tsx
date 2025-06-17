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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-center space-x-2 sm:w-auto">
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar produtos..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <Button onClick={() => router.push("/products/new")} className="bg-yellow-500 text-black hover:bg-yellow-400">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
            </Button>
        </div>
    )
}