import type { Metadata } from "next"
import { UserForm } from "@/components/users/user-form"

export const metadata: Metadata = {
  title: "Editar Usuário",
  description: "Editar usuário existente",
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Editar Usuário</h2>
      <div className="space-y-4">
        <UserForm userId={params.id} />
      </div>
    </div>
  )
}
