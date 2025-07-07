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
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchInstitutions, deleteInstitution } from "@/lib/api/institutions-api"
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
import { InstitutionTableToolbar } from "./institution-table-toolbar"
import { InstitutionCard } from "./institution-card"

type Institution = {
  id: string
  contractNumber: string
  name: string
  observations: string
  events: string[]
  userCount: number
  createdAt: string
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
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteInstitutionId, setDeleteInstitutionId] = useState<string | null>(null)
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

  const { data: institutions = [], isLoading } = useQuery({
    queryKey: ["institutions", currentPage, pageSize, debouncedSearchTerm],
    queryFn: () =>
      fetchInstitutions({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
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

  const columns: ColumnDef<Institution>[] = [
    {
      accessorKey: "contractNumber",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nº do Contrato
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
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
            <Users className="h-4 w-4 text-yellow-500" />
            <span>{userCount}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "events",
      header: "Eventos",
      cell: ({ row }) => {
        const events = row.getValue<string[]>("events")
        return <Badge variant="outline">{events.length} eventos</Badge>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Data de Criação",
      cell: ({ row }) => {
        return new Date(row.getValue<string>("createdAt")).toLocaleDateString("pt-BR")
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const institution = row.original

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
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <InstitutionTableToolbar onSearchChange={handleSearchChange} />
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
      <InstitutionTableToolbar onSearchChange={handleSearchChange} />
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
          <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
            {debouncedSearchTerm
              ? "Nenhum contrato encontrado para a busca."
              : "Nenhum resultado encontrado."}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
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

