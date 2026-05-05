// components/products/products-table.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    type SortingState,
    getSortedRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye, ImageIcon, Pencil, Trash2, Video } from "lucide-react"
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
import { ProductCard } from "./product-card"
import { ProductForm } from "./product-form"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type SheetMode = "view" | "create" | "edit"

const getErrorMessage = (error: any): string => {
    if (error?.message) {
        return error.message
    }
    return "Não foi possível excluir o produto. Tente novamente."
}

export function ProductsTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
    const [sheetMode, setSheetMode] = useState<SheetMode>("view")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
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

    const openCreateSheet = () => {
        setSelectedProduct(null)
        setSheetMode("create")
        setIsSheetOpen(true)
    }

    const openViewSheet = (product: Product) => {
        setSelectedProduct(product)
        setSheetMode("view")
        setIsSheetOpen(true)
    }

    const openEditSheet = (product: Product) => {
        setSelectedProduct(product)
        setSheetMode("edit")
        setIsSheetOpen(true)
    }

    const closeSheet = () => {
        setIsSheetOpen(false)
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
                <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
                return <Badge variant="outline" className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">{ProductFlag[flag]}</Badge>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const product = row.original
                return (
                    <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
                            onClick={() => openViewSheet(product)}
                        >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizar</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
                            onClick={() => openEditSheet(product)}
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => handleDelete(product.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                    </div>
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
                <ProductTableToolbar onSearchChange={handleSearchChange} onCreateClick={openCreateSheet} />
                <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
                    <div className="flex h-24 items-center justify-center">
                        <Skeleton className="h-8 w-[200px] bg-zinc-800" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <ProductTableToolbar onSearchChange={handleSearchChange} onCreateClick={openCreateSheet} />
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 md:block">
                <Table>
                    <TableHeader className="bg-white/[0.04]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-zinc-400">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer border-white/10 hover:bg-white/[0.04]"
                                    onClick={() => openViewSheet(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-zinc-100">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-400">
                                    Nenhum resultado encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="block md:hidden space-y-4">
                {products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onView={openViewSheet}
                            onEdit={openEditSheet}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center text-zinc-400">
                        {debouncedSearchTerm ? "Nenhum produto encontrado para a busca." : "Nenhum resultado encontrado."}
                    </div>
                )}
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

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full overflow-y-auto border-l border-yellow-400/20 bg-zinc-950 p-0 text-white sm:max-w-3xl">
                    <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
                        <SheetHeader>
                            <SheetTitle className="text-white">
                                {sheetMode === "create" && "Novo produto"}
                                {sheetMode === "edit" && "Editar produto"}
                                {sheetMode === "view" && "Detalhes do produto"}
                            </SheetTitle>
                            <SheetDescription className="text-zinc-400">
                                {sheetMode === "create" && "Cadastre um produto sem sair da listagem."}
                                {sheetMode === "edit" && "Atualize os dados do produto selecionado."}
                                {sheetMode === "view" && "Visualize informações, categoria e mídias cadastradas."}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="p-6">
                        {sheetMode === "view" && selectedProduct && (
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <Badge variant="outline" className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
                                                {ProductFlag[selectedProduct.flag]}
                                            </Badge>
                                            <h3 className="mt-3 text-xl font-semibold text-white">{selectedProduct.name}</h3>
                                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                                                {selectedProduct.description || "Sem descrição cadastrada."}
                                            </p>
                                        </div>
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950">
                                            <ImageIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <ImageIcon className="h-4 w-4 text-yellow-300" />
                                        <p className="mt-3 text-2xl font-semibold text-white">{selectedProduct.photos?.length ?? 0}</p>
                                        <p className="text-xs text-zinc-400">fotos cadastradas</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <Video className="h-4 w-4 text-yellow-300" />
                                        <p className="mt-3 text-2xl font-semibold text-white">{selectedProduct.video?.length ?? 0}</p>
                                        <p className="text-xs text-zinc-400">vídeos cadastrados</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <Pencil className="h-4 w-4 text-yellow-300" />
                                        <p className="mt-3 text-sm font-semibold text-white">
                                            {new Date(selectedProduct.createdAt).toLocaleDateString("pt-BR")}
                                        </p>
                                        <p className="text-xs text-zinc-400">data de criação</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <h4 className="mb-4 text-sm font-semibold text-white">Mídias</h4>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                                            <p className="text-sm font-medium text-zinc-200">Fotos</p>
                                            <p className="mt-1 text-sm text-zinc-400">{selectedProduct.photos?.length ? `${selectedProduct.photos.length} arquivo(s)` : "Nenhuma foto cadastrada."}</p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                                            <p className="text-sm font-medium text-zinc-200">Vídeos</p>
                                            <p className="mt-1 text-sm text-zinc-400">{selectedProduct.video?.length ? `${selectedProduct.video.length} arquivo(s)` : "Nenhum vídeo cadastrado."}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        className="bg-yellow-400 font-semibold text-zinc-950 hover:bg-yellow-300"
                                        onClick={() => setSheetMode("edit")}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar produto
                                    </Button>
                                </div>
                            </div>
                        )}

                        {sheetMode === "create" && (
                            <ProductForm onSuccess={closeSheet} onCancel={closeSheet} />
                        )}

                        {sheetMode === "edit" && selectedProduct && (
                            <ProductForm productId={selectedProduct.id} onSuccess={closeSheet} onCancel={closeSheet} />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
