"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
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
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchInstitutions, deleteInstitution, type Institution } from "@/lib/api/institutions-api"
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
import { useToast } from "@/hooks/use-toast"
import { InstitutionTableToolbar } from "./institution-table-toolbar"
import { InstitutionCard } from "./institution-card"

type SortConfig = {
  sortBy: string | null
  order: "asc" | "desc" | null
}

const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return "Não foi possível excluir o contrato. Tente novamente."
}

export function InstitutionsTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteInstitutionId, setDeleteInstitutionId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: null, order: null })
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

  const { data: institutions = [], isLoading } = useQuery({
    queryKey: ["institutions", currentPage, pageSize, debouncedSearchTerm, sortConfig.sortBy, sortConfig.order],
    queryFn: () =>
      fetchInstitutions({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        sortBy: sortConfig.sortBy || undefined,
        order: sortConfig.order || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInstitution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      })
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir contrato",
        description: errorMessage,
      })
    },
  })

  const handleDelete = (id: string) => {
    setDeleteInstitutionId(id)
  }

  const confirmDelete = () => {
    if (deleteInstitutionId) {
      deleteMutation.mutate(deleteInstitutionId)
      setDeleteInstitutionId(null)
    }
  }

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search)
  }, [])

  const handleSort = (columnId: string) => {
    setSortConfig((prev) => {
      // If clicking the same column
      if (prev.sortBy === columnId) {
        // Cycle through: asc -> desc -> null
        if (prev.order === "asc") {
          return { sortBy: columnId, order: "desc" }
        } else if (prev.order === "desc") {
          return { sortBy: null, order: null }
        }
      }
      // New column or resetting
      return { sortBy: columnId, order: "asc" }
    })
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const getSortIcon = (columnId: string) => {
    if (sortConfig.sortBy !== columnId) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortConfig.order === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  const columns: ColumnDef<Institution, any>[] = [
    {
      accessorKey: "contractNumber",
      header: () => {
        return (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => handleSort("contractNumber")}>
            Nº do Contrato
            {getSortIcon("contractNumber")}
          </Button>
        )
      },
    },
    {
      accessorKey: "name",
      header: () => {
        return (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => handleSort("name")}>
            Nome
            {getSortIcon("name")}
          </Button>
        )
      },
    },
    {
      accessorKey: "userCount",
      header: "Usuários",
      cell: ({ row }) => {
        const userCount = row.getValue<number>("userCount")
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-yellow-300" />
            <span className="text-zinc-100">{userCount}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "events",
      header: "Eventos",
      cell: ({ row }) => {
        const events = row.getValue<Institution["events"]>("events")
        return <Badge variant="outline" className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">{events.length} eventos</Badge>
      },
    },
    {
      accessorKey: "createdAt",
      header: () => {
        return (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => handleSort("createdAt")}>
            Data de Criação
            {getSortIcon("createdAt")}
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="text-zinc-300">{new Date(row.getValue<string>("createdAt")).toLocaleDateString("pt-BR")}</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const institution = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:bg-white/5 hover:text-yellow-300">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/institutions/${institution.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(institution.id)}
              >
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
    data: institutions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <InstitutionTableToolbar onSearchChange={handleSearchChange} />
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
      <InstitutionTableToolbar onSearchChange={handleSearchChange} />
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 md:block">
        <Table>
          <TableHeader className="bg-white/[0.04]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-zinc-400">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-white/10 hover:bg-white/[0.04]">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-zinc-100">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-400">
                  {debouncedSearchTerm
                    ? "Nenhum contrato encontrado para a busca."
                    : "Nenhum resultado encontrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="block md:hidden space-y-4">
        {institutions.length > 0 ? (
          institutions.map((institution) => (
            <InstitutionCard key={institution.id} institution={institution} onDelete={handleDelete} />
          ))
        ) : (
          <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center text-zinc-400">
            {debouncedSearchTerm
              ? "Nenhum contrato encontrado para a busca."
              : "Nenhum resultado encontrado."}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={institutions.length < pageSize}
        >
          Próximo
        </Button>
      </div>

      <AlertDialog open={!!deleteInstitutionId} onOpenChange={() => setDeleteInstitutionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a instituição do sistema.
            </AlertDialogDescription>
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
