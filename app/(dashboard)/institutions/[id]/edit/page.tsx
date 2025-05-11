import type { Metadata } from "next"
import { InstitutionForm } from "@/components/institutions/institution-form"

export const metadata: Metadata = {
  title: "Editar Instituição",
  description: "Editar instituição existente",
}

export default function EditInstitutionPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Editar Instituição</h2>
      <div className="space-y-4">
        <InstitutionForm institutionId={params.id} />
      </div>
    </div>
  )
}
