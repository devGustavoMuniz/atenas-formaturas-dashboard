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
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchUsers, deleteUser } from "@/lib/api/users-api"
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
import { UserTableToolbar } from "./user-table-toolbar"
import { UserCard } from "./user-card"
import type { User } from "@/lib/types"

type SortConfig = {
  sortBy: string | null
  order: "asc" | "desc" | null
}

// Helper function to format relative time
function formatLastLogin(dateString?: string): string {
  if (!dateString) return "Nunca"

  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Agora mesmo"
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} atrás`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`
  }
  if (diffInSeconds < 172800) {
    return "Ontem"
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} dias atrás`
  }

  // For dates older than a week, show formatted date
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", "")
}

const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return "Não foi possível excluir o usuário. Tente novamente."
}

export function UsersTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)
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

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", currentPage, pageSize, debouncedSearchTerm, institutionId, sortConfig.sortBy, sortConfig.order],
    queryFn: () =>
      fetchUsers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        institutionId: institutionId || undefined,
        sortBy: sortConfig.sortBy || undefined,
        order: sortConfig.order || undefined,
      }),
  })

  const isLoading = isLoadingUsers

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      })
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: errorMessage,
      })
    },
  })

  const handleDelete = (id: string) => {
    setDeleteUserId(id)
  }

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteMutation.mutate(deleteUserId)
      setDeleteUserId(null)
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

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "userContract",
      header: () => {
        return (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => handleSort("userContract")}>
            Nº do Contrato
            {getSortIcon("userContract")}
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="text-zinc-300">{row.getValue("userContract")}</div>
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
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-1 ring-yellow-400/20">
              <AvatarImage src={row.original.profileImage || "/placeholder.svg"} alt={row.getValue("name")} />
              <AvatarFallback>{row.getValue<string>("name").charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-medium text-zinc-100">{row.getValue("name")}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: () => {
        return (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => handleSort("email")}>
            Email
            {getSortIcon("email")}
          </Button>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Cargo",
      cell: ({ row }) => {
        const role = row.getValue<"admin" | "client">("role")
        return (
          <Badge variant="outline" className={role === "admin" ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-200" : "border-white/10 bg-white/10 text-zinc-200"}>
            {role === "admin" ? "Administrador" : "Cliente"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: () => {
        return (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-yellow-300" onClick={() => handleSort("lastLoginAt")}>
            Último Login
            {getSortIcon("lastLoginAt")}
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <span className="text-sm text-zinc-400">
            {formatLastLogin(row.original.lastLoginAt)}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original

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
              <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/upload-photos`)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload de Fotos
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(user.id)}
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
    data: users,
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
        <UserTableToolbar
          onSearchChange={handleSearchChange}
          onInstitutionChange={(id) => {
            setInstitutionId(id)
            setCurrentPage(1)
          }}
        />
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
      <UserTableToolbar
        onSearchChange={handleSearchChange}
        onInstitutionChange={(id) => {
          setInstitutionId(id)
          setCurrentPage(1)
        }}
      />
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
                  {debouncedSearchTerm ? "Nenhum usuário encontrado para a busca." : "Nenhum resultado encontrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="block md:hidden space-y-4">
        {users.length > 0 ? (
          users.map((user) => <UserCard key={user.id} user={user} onDelete={handleDelete} />)
        ) : (
          <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center text-zinc-400">
            {debouncedSearchTerm ? "Nenhum usuário encontrado para a busca." : "Nenhum resultado encontrado."}
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
          disabled={users.length < pageSize}
        >
          Próximo
        </Button>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário do sistema.
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
