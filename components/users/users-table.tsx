"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchUsers, deleteUser } from "@/lib/api/users-api"
import { fetchInstitutions } from "@/lib/api/institutions-api"
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

type User = {
  id: string
  name: string
  identifier: string
  email: string
  phone: string
  observations?: string
  role: "admin" | "client"
  institutionId: string
  fatherName?: string
  fatherPhone?: string
  motherName?: string
  motherPhone?: string
  driveLink?: string
  creditValue?: number
  profileImage?: string
  status: "active" | "inactive"
  createdAt: string
}

export function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", currentPage, pageSize],
    queryFn: () => fetchUsers({ page: currentPage, limit: pageSize }),
  })

  const { data: institutions = [], isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["institutions"],
    queryFn: () => fetchInstitutions(),
  })

  const isLoading = isLoadingUsers || isLoadingInstitutions

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o usuário. Tente novamente.",
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

  const getInstitutionContractNumber = (institutionId: string) => {
    const institution = institutions.find((i) => i.id === institutionId)
    return institution?.contractNumber || "N/A"
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "institutionId",
      header: "Nº do Contrato",
      cell: ({ row }) => {
        const institutionId = row.getValue<string>("institutionId")
        return <div>{getInstitutionContractNumber(institutionId)}</div>
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
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.profileImage || "/placeholder.svg"} alt={row.getValue("name")} />
              <AvatarFallback>{row.getValue<string>("name").charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="font-medium">{row.getValue("name")}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Telefone",
    },
    {
      accessorKey: "role",
      header: "Cargo",
      cell: ({ row }) => {
        const role = row.getValue<"admin" | "client">("role")
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role === "admin" ? "Administrador" : "Cliente"}
          </Badge>
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
              <Button variant="ghost" className="h-8 w-8 p-0">
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
      <div className="rounded-md border">
        <div className="h-24 flex items-center justify-center">
          <Skeleton className="h-8 w-[200px]" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border">
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
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
