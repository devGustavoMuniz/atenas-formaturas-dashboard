import type { Metadata } from "next"
import { UserForm } from "@/components/users/user-form"

export const metadata: Metadata = {
  title: "Novo Usuário",
  description: "Adicionar novo usuário",
}

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Novo Usuário</h2>
      <div className="space-y-4">
        <UserForm />
      </div>
    </div>
  )
}
