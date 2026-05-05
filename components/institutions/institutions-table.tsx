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
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Pencil, Trash2, Users, Settings, CalendarDays, Building2, Loader2, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchInstitutions, deleteInstitution, sendCredentials, type Institution } from "@/lib/api/institutions-api"
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
import { InstitutionForm } from "./institution-form"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type SortConfig = {
  sortBy: string | null
  order: "asc" | "desc" | null
}

type SheetMode = "view" | "create" | "edit"

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
  const [sheetMode, setSheetMode] = useState<SheetMode>("view")
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
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

  const sendCredentialsMutation = useMutation({
    mutationFn: (institutionId: string) => sendCredentials(institutionId),
    onSuccess: (data) => {
      if (data.credentialsSent === 0 && data.totalStudents === 0) {
        toast({
          title: "Nenhum usuário pendente",
          description: "Todos os usuários deste contrato já acessaram a plataforma.",
        })
      } else if (data.failedEmails > 0) {
        toast({
          variant: "destructive",
          title: "Envio parcial",
          description: `${data.credentialsSent} de ${data.totalStudents} emails enviados. ${data.failedEmails} falharam.`,
        })
      } else {
        toast({
          title: "Credenciais enviadas!",
          description: `${data.credentialsSent} email(s) de boas-vindas enviado(s) com sucesso.`,
        })
      }
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao enviar credenciais",
        description: errorMessage,
      })
    },
  })

  const handleDelete = (id: string) => {
    setDeleteInstitutionId(id)
  }

  const openCreateSheet = () => {
    setSelectedInstitution(null)
    setSheetMode("create")
    setIsSheetOpen(true)
  }

  const openViewSheet = (institution: Institution) => {
    setSelectedInstitution(institution)
    setSheetMode("view")
    setIsSheetOpen(true)
  }

  const openEditSheet = (institution: Institution) => {
    setSelectedInstitution(institution)
    setSheetMode("edit")
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
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
          <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
              onClick={() => openViewSheet(institution)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-yellow-300"
              onClick={() => openEditSheet(institution)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => handleDelete(institution.id)}
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
        <InstitutionTableToolbar onSearchChange={handleSearchChange} onCreateClick={openCreateSheet} />
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
      <InstitutionTableToolbar onSearchChange={handleSearchChange} onCreateClick={openCreateSheet} />
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
            <InstitutionCard
              key={institution.id}
              institution={institution}
              onView={openViewSheet}
              onEdit={openEditSheet}
              onDelete={handleDelete}
            />
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full overflow-y-auto border-l border-yellow-400/20 bg-zinc-950 p-0 text-white sm:max-w-2xl">
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
            <SheetHeader>
              <SheetTitle className="text-white">
                {sheetMode === "create" && "Novo contrato"}
                {sheetMode === "edit" && "Editar contrato"}
                {sheetMode === "view" && "Detalhes do contrato"}
              </SheetTitle>
              <SheetDescription className="text-zinc-400">
                {sheetMode === "create" && "Cadastre um novo contrato sem sair da listagem."}
                {sheetMode === "edit" && "Atualize os dados do contrato selecionado."}
                {sheetMode === "view" && "Visualize as informações principais e eventos vinculados."}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="p-6">
            {sheetMode === "view" && selectedInstitution && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-yellow-300">{selectedInstitution.contractNumber}</p>
                      <h3 className="mt-1 text-xl font-semibold text-white">{selectedInstitution.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {selectedInstitution.observations || "Nenhuma observação cadastrada."}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <Users className="h-4 w-4 text-yellow-300" />
                    <p className="mt-3 text-2xl font-semibold text-white">{selectedInstitution.userCount}</p>
                    <p className="text-xs text-zinc-400">usuários vinculados</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <CalendarDays className="h-4 w-4 text-yellow-300" />
                    <p className="mt-3 text-2xl font-semibold text-white">{selectedInstitution.events.length}</p>
                    <p className="text-xs text-zinc-400">eventos cadastrados</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <Building2 className="h-4 w-4 text-yellow-300" />
                    <p className="mt-3 text-sm font-semibold text-white">
                      {new Date(selectedInstitution.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-zinc-400">data de criação</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Eventos</h4>
                    <Badge variant="outline" className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
                      {selectedInstitution.events.length}
                    </Badge>
                  </div>
                  {selectedInstitution.events.length > 0 ? (
                    <div className="space-y-2">
                      {selectedInstitution.events.map((event) => (
                        <div key={event.id} className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
                          {event.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">Nenhum evento cadastrado.</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="bg-yellow-400 font-semibold text-zinc-950 hover:bg-yellow-300"
                    onClick={() => setSheetMode("edit")}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar contrato
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
                    disabled={sendCredentialsMutation.isPending}
                    onClick={() => sendCredentialsMutation.mutate(selectedInstitution.id)}
                  >
                    {sendCredentialsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Enviar credenciais
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-yellow-300"
                    onClick={() => router.push(`/institutions/${selectedInstitution.id}/products`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar produtos
                  </Button>
                </div>
              </div>
            )}

            {sheetMode === "create" && (
              <InstitutionForm onSuccess={closeSheet} onCancel={closeSheet} />
            )}

            {sheetMode === "edit" && selectedInstitution && (
              <InstitutionForm institutionId={selectedInstitution.id} onSuccess={closeSheet} onCancel={closeSheet} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
