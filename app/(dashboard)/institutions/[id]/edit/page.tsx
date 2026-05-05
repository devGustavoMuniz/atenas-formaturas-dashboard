import { InstitutionForm } from "@/components/institutions/institution-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Editar Contrato",
  description: "Editar contrato existente",
}

type EditInstitutionPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditInstitutionPage({ params }: EditInstitutionPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Editar Contrato</h2>
      </div>
      <InstitutionForm institutionId={id} />
    </div>
  )
}
