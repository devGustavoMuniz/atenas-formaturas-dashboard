import { InstitutionForm } from "@/components/institutions/institution-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Novo Contrato",
  description: "Adicionar novo contrato",
}

export default function NewInstitutionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Novo Contrato</h2>
      </div>
      <InstitutionForm />
    </div>
  )
}

