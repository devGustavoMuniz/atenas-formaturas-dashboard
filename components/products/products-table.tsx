// components/products/products-table.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type SortingState,
    getSortedRowModel,
    type ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchProducts, deleteProduct } from "@/lib/api/products-api"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ProductTableToolbar } from "../../app/(dashboard)/products/product-table-toolbar"
import type { Product } from "@/lib/types"
import { ProductFlag } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const getErrorMessage = (error: any): string => {
    if (error?.message) {
        return error.message
    }
    return "Não foi possível excluir o produto. Tente novamente."
}

export function ProductsTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            setCurrentPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products", currentPage, pageSize, debouncedSearchTerm],
        queryFn: () =>
            fetchProducts({
                page: currentPage,
                limit: pageSize,
                search: debouncedSearchTerm || undefined,
            }),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast({
                title: "Produto excluído",
                description: "O produto foi excluído com sucesso.",
            })
        },
        onError: (error) => {
            const errorMessage = getErrorMessage(error)
            toast({
                variant: "destructive",
                title: "Erro ao excluir produto",
                description: errorMessage,
            })
        },
    })

    const handleDelete = (id: string) => {
        setDeleteProductId(id)
    }

    const confirmDelete = () => {
        if (deleteProductId) {
            deleteMutation.mutate(deleteProductId)
            setDeleteProductId(null)
        }
    }

    const handleSearchChange = useCallback((search: string) => {
        setSearchTerm(search)
    }, [])

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "flag",
            header: "Categoria",
            cell: ({ row }) => {
                const flag = row.getValue<"ALBUM" | "GENERIC" | "DIGITAL_FILES">("flag");
                return <Badge variant="outline">{ProductFlag[flag]}</Badge>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const product = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/products/${product.id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const table = useReactTable({
        data: products,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
    })

    if (isLoading) {
        return (
            <div className="space-y-4">
                <ProductTableToolbar onSearchChange={handleSearchChange} />
                <div className="rounded-md border">
                    <div className="h-24 flex items-center justify-center">
                        <Skeleton className="h-8 w-[200px]" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <ProductTableToolbar onSearchChange={handleSearchChange} />
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Nenhum resultado encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}