import type { Metadata } from "next"
import { InstitutionForm } from "@/components/institutions/institution-form"

export const metadata: Metadata = {
  title: "Nova Instituição",
  description: "Adicionar nova instituição",
}

export default function NewInstitutionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Nova Instituição</h2>
      <div className="space-y-4">
        <InstitutionForm />
      </div>
    </div>
  )
}
