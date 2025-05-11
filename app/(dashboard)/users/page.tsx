import type { Metadata } from "next"
import { UsersTable } from "@/components/users/users-table"
import { UserTableToolbar } from "@/components/users/user-table-toolbar"

export const metadata: Metadata = {
  title: "Usuários",
  description: "Gerenciamento de usuários",
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
      <div className="space-y-4">
        <UserTableToolbar />
        <UsersTable />
      </div>
    </div>
  )
}
